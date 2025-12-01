/**
 * Seed script to create three default subscription plans
 * Run with: npm run seed:plans
 */

// Load environment variables FIRST
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

import connectDB from '../lib/db/connection';
import SubscriptionPlan, { PlanBillingCycle, PlanStatus } from '../models/SubscriptionPlan';

// Define available features for the product
const AVAILABLE_FEATURES = {
  patients: 'Patient Management',
  appointments: 'Appointment Scheduling',
  queue: 'Queue Management',
  prescriptions: 'Prescriptions Management',
  invoices: 'Invoice & Billing',
  inventory: 'Inventory Management',
  reports: 'Reports & Analytics',
  reminders: 'Automated Reminders',
  multiLocation: 'Multi-Location Support',
  telemedicine: 'Telemedicine',
  api: 'API Access',
  customBranding: 'Custom Branding',
  prioritySupport: 'Priority Support',
  advancedReports: 'Advanced Reports & Analytics',
  dataExport: 'Data Export',
  auditLogs: 'Audit Logs',
  compliance: 'HIPAA/GDPR Compliance',
  whiteLabel: 'White Label Solution',
  dedicatedSupport: 'Dedicated Support',
};

const PLANS = [
  {
    name: 'Basic',
    description: 'Perfect for small clinics getting started',
    price: 49.99, // in dollars
    currency: 'USD',
    billingCycle: PlanBillingCycle.MONTHLY,
    features: [
      AVAILABLE_FEATURES.patients,
      AVAILABLE_FEATURES.appointments,
      AVAILABLE_FEATURES.queue,
      AVAILABLE_FEATURES.prescriptions,
      AVAILABLE_FEATURES.invoices,
      AVAILABLE_FEATURES.inventory,
    ],
    maxUsers: 5,
    maxPatients: 500,
    maxStorageGB: 10,
    isPopular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal for growing clinics with advanced needs',
    price: 99.99,
    currency: 'USD',
    billingCycle: PlanBillingCycle.MONTHLY,
    features: [
      AVAILABLE_FEATURES.patients,
      AVAILABLE_FEATURES.appointments,
      AVAILABLE_FEATURES.queue,
      AVAILABLE_FEATURES.prescriptions,
      AVAILABLE_FEATURES.invoices,
      AVAILABLE_FEATURES.inventory,
      AVAILABLE_FEATURES.reports,
      AVAILABLE_FEATURES.reminders,
      AVAILABLE_FEATURES.multiLocation,
      AVAILABLE_FEATURES.advancedReports,
      AVAILABLE_FEATURES.dataExport,
      AVAILABLE_FEATURES.auditLogs,
    ],
    maxUsers: 20,
    maxPatients: 5000,
    maxStorageGB: 50,
    isPopular: true,
  },
  {
    name: 'Enterprise',
    description: 'Complete solution for large clinics and organizations',
    price: 199.99,
    currency: 'USD',
    billingCycle: PlanBillingCycle.MONTHLY,
    features: [
      AVAILABLE_FEATURES.patients,
      AVAILABLE_FEATURES.appointments,
      AVAILABLE_FEATURES.queue,
      AVAILABLE_FEATURES.prescriptions,
      AVAILABLE_FEATURES.invoices,
      AVAILABLE_FEATURES.inventory,
      AVAILABLE_FEATURES.reports,
      AVAILABLE_FEATURES.reminders,
      AVAILABLE_FEATURES.multiLocation,
      AVAILABLE_FEATURES.telemedicine,
      AVAILABLE_FEATURES.api,
      AVAILABLE_FEATURES.customBranding,
      AVAILABLE_FEATURES.prioritySupport,
      AVAILABLE_FEATURES.advancedReports,
      AVAILABLE_FEATURES.dataExport,
      AVAILABLE_FEATURES.auditLogs,
      AVAILABLE_FEATURES.compliance,
      AVAILABLE_FEATURES.whiteLabel,
      AVAILABLE_FEATURES.dedicatedSupport,
    ],
    maxUsers: 100,
    maxPatients: 50000,
    maxStorageGB: 500,
    isPopular: false,
  },
];

async function seedPlans() {
  try {
    console.log('🚀 Seeding subscription plans...\n');

    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    for (const planData of PLANS) {
      // Check if plan already exists
      const existing = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existing) {
        console.log(`⚠️  Plan "${planData.name}" already exists. Skipping...\n`);
        continue;
      }

      // Create plan (price will be converted to cents in the service)
      const plan = await SubscriptionPlan.create({
        name: planData.name,
        description: planData.description,
        price: Math.round(planData.price * 100), // Convert to cents
        currency: planData.currency,
        billingCycle: planData.billingCycle,
        features: planData.features,
        maxUsers: planData.maxUsers,
        maxPatients: planData.maxPatients,
        maxStorageGB: planData.maxStorageGB,
        status: PlanStatus.ACTIVE,
        isPopular: planData.isPopular,
      });

      console.log(`✅ Created plan: ${plan.name}`);
      console.log(`   Price: $${planData.price}/${planData.billingCycle === PlanBillingCycle.MONTHLY ? 'mo' : 'yr'}`);
      console.log(`   Features: ${planData.features.length}`);
      console.log(`   Max Users: ${planData.maxUsers}`);
      console.log(`   Max Patients: ${planData.maxPatients?.toLocaleString()}`);
      console.log(`   Max Storage: ${planData.maxStorageGB}GB\n`);
    }

    console.log('🎉 Subscription plans seeded successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Basic: $${PLANS[0].price}/month`);
    console.log(`   - Professional: $${PLANS[1].price}/month (Popular)`);
    console.log(`   - Enterprise: $${PLANS[2].price}/month\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding plans:', error.message || error);
    process.exit(1);
  }
}

seedPlans();

