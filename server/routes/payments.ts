import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.ts';
import { PaymentTransaction } from '../../src/types/index.ts';

const router = Router();

// Official verified Ethiopian account numbers for WAS Jobs commission & fees
export const VERIFIED_ACCOUNTS = {
  cbe: {
    bankNameAm: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
    bankNameEn: 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: '1000769746343',
    accountName: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
    branch: 'Addis Ababa / ዋና ቅርንጫፍ',
  },
  telebirr: {
    providerAm: 'ቴሌብር (Telebirr - Ethio Telecom)',
    providerEn: 'Telebirr (Ethio Telecom)',
    phoneNumber: '0966087039',
    receiverName: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
    instructionAm: 'በቴሌብር መተግበሪያ ወይም በ*127# ወደ 0966087039 (ሀብታሙ ጌታቸው) ይላኩ',
    instructionEn: 'Send via Telebirr SuperApp or *127# to 0966087039 (Habitamu Getachew)',
  },
};

// Check Ethiopian payment gateways & verified account details
router.get('/status', (_req, res: Response) => {
  const telebirrConfigured = !!(process.env.TELEBIRR_APP_ID && process.env.TELEBIRR_APP_KEY);
  const cbeBirrConfigured = !!(process.env.CBE_BIRR_MERCHANT_ID && process.env.CBE_BIRR_KEY);
  const chapaConfigured = !!process.env.CHAPA_SECRET_KEY;

  res.json({
    verifiedAccounts: VERIFIED_ACCOUNTS,
    providers: [
      {
        id: 'cbe_birr',
        nameEn: 'Commercial Bank of Ethiopia (CBE)',
        nameAm: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
        accountNumber: '1000769746343',
        accountName: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
        status: 'verified_active',
        isManualVerified: true,
        descriptionEn: 'Official verified CBE account. Transfer directly to 1000769746343 (Habitamu Getachew) via CBE Mobile Banking, CBE Birr, or Branch.',
        descriptionAm: 'ይፋዊ የተረጋገጠ የኢትዮጵያ ንግድ ባንክ ሒሳብ ቁጥር፡ 1000769746343 (ሀብታሙ ጌታቸው)። በሲቢኢ ሞባይል ባንኪንግ ወይም በቅርንጫፍ ይላኩ።',
      },
      {
        id: 'telebirr',
        nameEn: 'Telebirr (ቴሌብር)',
        nameAm: 'ቴሌብር (ኢትዮ ቴሌኮም)',
        accountNumber: '0966087039',
        accountName: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
        status: 'verified_active',
        isManualVerified: true,
        descriptionEn: 'Official verified Telebirr phone: 0966087039 (Habitamu Getachew). Send via Telebirr app or *127# and submit transaction reference.',
        descriptionAm: 'ይፋዊ የተረጋገጠ የቴሌብር ስልክ ቁጥር፡ 0966087039 (ሀብታሙ ጌታቸው)። በቴሌብር መተግበሪያ ወይም በ*127# ልከው የግብይት ቁጥሩን ያስገቡ።',
      },
      {
        id: 'chapa',
        nameEn: 'Chapa Gateway (ቻፓ)',
        nameAm: 'ቻፓ የክፍያ መተላለፊያ',
        provider: 'Chapa Financial Technologies',
        status: chapaConfigured ? 'connected' : 'pending_configuration',
        descriptionEn: 'Unified API payment gateway supporting bank cards and instant checkout.',
        descriptionAm: 'ቴሌብርንና ባንኮችን የሚያስተባብር ዘመናዊ የክፍያ በር (API)።',
        requiredEnv: ['CHAPA_SECRET_KEY', 'CHAPA_PUBLIC_KEY'],
      },
    ],
    pricing: {
      commission_standard: {
        priceETB: 1000,
        labelEn: 'Standard Platform Hiring Commission',
        labelAm: 'መደበኛ የቅጥር እና የአገልግሎት ኮሚሽን',
      },
      featured_job: {
        priceETB: 500,
        labelEn: 'Featured Job Listing (14 Days Highlight)',
        labelAm: 'የተለየ (Featured) የስራ ማስታወቂያ (ለ14 ቀናት ከላይ የሚታይ)',
      },
      company_verification: {
        priceETB: 1500,
        labelEn: 'Verified Employer Blue Badge (1 Year)',
        labelAm: 'የተረጋገጠ አሰሪ ሰማያዊ ምልክት (ለ1 ዓመት)',
      },
    },
    securityNoticeEn: 'Security Guarantee: WAS Jobs Ethiopia never stores your bank passwords or Telebirr PINs. All transfers are made securely to verified accounts (CBE: 1000769746343, Telebirr: 0966087039 - Habitamu Getachew).',
    securityNoticeAm: 'የደህንነት ዋስትና፡ ዋስ ስራ የባንክ የይለፍ ቃልዎን ወይም ፒን በጭራሽ አይጠይቅም ወይም አያስቀምጥም። ሁሉም ክፍያዎች ወደ ተረጋገጡ የባንክና ቴሌብር ሒሳቦች (CBE: 1000769746343, Telebirr: 0966087039 - ሀብታሙ ጌታቸው) በቀጥታ ይፈጸማሉ።',
  });
});

// Submit a new commission payment / fee transaction with transaction reference
router.post('/submit-commission', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    amount,
    provider,
    purpose,
    transactionRef,
    payerName,
    payerPhone,
    targetId,
    notes,
  } = req.body;

  if (!amount || !provider || !transactionRef) {
    return res.status(400).json({
      error: 'Please fill the payment amount, method (CBE or Telebirr), and transaction reference number. እባክዎ የክፍያ መጠን፣ ዘዴ እና የግብይት ቁጥር (Transaction Ref) ያስገቡ።',
    });
  }

  const validProviders = ['cbe_birr', 'telebirr', 'chapa'];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: 'Invalid payment method.' });
  }

  const user = req.user!;
  const newTx: PaymentTransaction = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: user.id,
    payerName: payerName?.trim() || user.fullName,
    amount: Number(amount),
    currency: 'ETB',
    provider: provider as 'telebirr' | 'cbe_birr' | 'chapa',
    purpose: (purpose as any) || 'commission',
    targetId: targetId || undefined,
    status: 'pending_verification',
    phone: payerPhone?.trim() || user.phone || '0966087039',
    accountNumber: provider === 'cbe_birr' ? '1000769746343' : '0966087039',
    transactionRef: transactionRef.trim().toUpperCase(),
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  db.update((database) => {
    database.payments.unshift(newTx);

    // Notify the Administrator (habitegechewe@gmail.com)
    const adminUser = database.users.find((u) => u.role === 'admin' || u.email === 'habitegechewe@gmail.com');
    if (adminUser) {
      const providerLabel = provider === 'cbe_birr' ? 'CBE (1000769746343)' : 'Telebirr (0966087039)';
      database.notifications.push({
        id: `notif_${Date.now()}`,
        userId: adminUser.id,
        titleEn: `New Payment to Verify: ${newTx.amount} ETB`,
        titleAm: `አዲስ የኮሚሽን ክፍያ ማረጋገጫ ቀርቧል፡ ${newTx.amount} ብር`,
        messageEn: `${newTx.payerName} submitted ${newTx.amount} ETB via ${providerLabel} (Ref: ${newTx.transactionRef}). Please review in Admin Dashboard.`,
        messageAm: `${newTx.payerName} ${newTx.amount} ብር በ${providerLabel} (Ref: ${newTx.transactionRef}) ልከዋል። እባክዎ በአስተዳዳሪ ክፍል ያረጋግጡ።`,
        type: 'system',
        read: false,
        link: '/admin',
        createdAt: new Date().toISOString(),
      });
    }

    // Confirmation notification to the user
    database.notifications.push({
      id: `notif_${Date.now() + 1}`,
      userId: user.id,
      titleEn: `Payment Reference Received (${newTx.transactionRef})`,
      titleAm: `የክፍያ ማረጋገጫ ቁጥርዎ ደርሶናል (${newTx.transactionRef})`,
      messageEn: `Your payment of ${newTx.amount} ETB is currently being verified by the administrator. Thank you!`,
      messageAm: `ያስገቡት የ${newTx.amount} ብር የክፍያ መረጃ በአስተዳዳሪው እየተጣራ ነው። ማረጋገጫው እንደተጠናቀቀ ወዲያው ይገለጽልዎታል።`,
      type: 'system',
      read: false,
      link: '/payments',
      createdAt: new Date().toISOString(),
    });
  });

  res.status(201).json({
    message: 'Payment reference submitted successfully for administrator verification. የክፍያ ማረጋገጫ ቁጥርዎ ለአስተዳዳሪው ደርሷል!',
    transaction: newTx,
  });
});

// Get user's own payment and commission transactions
router.get('/my-transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const transactions = db.get().payments
    .filter((p) => p.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ transactions });
});

// Admin: Get all payment and commission transactions
router.get('/admin-transactions', requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  const transactions = db.get().payments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ transactions, accounts: VERIFIED_ACCOUNTS });
});

// Admin: Verify or reject payment transaction
router.patch('/:id/verify', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const paymentId = req.params.id;
  const { status, adminNotes } = req.body;

  if (status !== 'verified' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be verified or rejected.' });
  }

  const tx = db.get().payments.find((p) => p.id === paymentId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  db.update((database) => {
    const target = database.payments.find((p) => p.id === paymentId);
    if (target) {
      target.status = status;
      target.verifiedAt = new Date().toISOString();
      target.verifiedBy = req.user!.email;
      if (adminNotes) {
        target.notes = `${target.notes ? target.notes + ' | ' : ''}Admin: ${adminNotes}`;
      }

      // If purpose was company verification, mark company verified
      if (status === 'verified' && target.purpose === 'company_verification') {
        const company = database.companies.find((c) => c.userId === target.userId);
        if (company) {
          company.verified = true;
        }
      }

      // If purpose was featured job, highlight the job
      if (status === 'verified' && target.purpose === 'featured_job' && target.targetId) {
        const job = database.jobs.find((j) => j.id === target.targetId);
        if (job) {
          job.isFeatured = true;
        }
      }

      // Notify the payer
      const isApproved = status === 'verified';
      database.notifications.push({
        id: `notif_${Date.now()}`,
        userId: target.userId,
        titleEn: isApproved ? 'Payment Verified Successfully!' : 'Payment Verification Issue',
        titleAm: isApproved ? 'የክፍያ ማረጋገጫዎ በተሳካ ሁኔታ ጸድቋል!' : 'በክፍያ ማረጋገጫዎ ላይ ማስታወሻ አለ',
        messageEn: isApproved
          ? `Your payment of ${target.amount} ETB (${target.provider === 'cbe_birr' ? 'CBE 1000769746343' : 'Telebirr 0966087039'}) has been verified. Thank you!`
          : `Your payment reference (${target.transactionRef}) could not be verified: ${adminNotes || 'Please check reference and contact support'}.`,
        messageAm: isApproved
          ? `ያስገቡት የ${target.amount} ብር ክፍያ (${target.provider === 'cbe_birr' ? 'CBE: 1000769746343' : 'Telebirr: 0966087039'}) ተረጋግጦ ጸድቋል። እናመሰግናለን!`
          : `ያስገቡት የክፍያ ማረጋገጫ ቁጥር (${target.transactionRef}) አልተረጋገጠም፡ ${adminNotes || 'እባክዎ ትክክለኛውን የግብይት ቁጥር ያረጋግጡ'}።`,
        type: 'system',
        read: false,
        link: '/payments',
        createdAt: new Date().toISOString(),
      });
    }
  });

  res.json({
    message: `Payment status updated to ${status}.`,
    transaction: db.get().payments.find((p) => p.id === paymentId),
  });
});

export default router;
