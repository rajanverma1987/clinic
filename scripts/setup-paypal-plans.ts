/**
 * Script to configure PayPal integration for existing subscription plans
 * This creates PayPal plans and links them to our database plans
 * Run with: npm run setup:paypal-plans
 */

// Load environment variables FIRST
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

import connectDB from '../lib/db/connection';
import SubscriptionPlan, { PlanStatus } from '../models/SubscriptionPlan';
import { createPayPalPlan } from '../services/paypal.service';

async function setupPayPalPlans() {
  try {
    console.log('🚀 Setting up PayPal integration for subscription plans...\n');

    // Check if PayPal credentials are configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.log('❌ ERROR: PayPal credentials not configured!');
      console.log('\nPlease add the following to your .env.local file:');
      console.log('```');
      console.log('PAYPAL_CLIENT_ID=your_paypal_client_id');
      console.log('PAYPAL_CLIENT_SECRET=your_paypal_client_secret');
      console.log('PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com');
      console.log('```\n');
      console.log('Get credentials from: https://developer.paypal.com/dashboard/\n');
      process.exit(1);
    }

    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get all PAID plans without PayPal integration
    const plansNeedingPayPal = await SubscriptionPlan.find({
      status: PlanStatus.ACTIVE,
      price: { $gt: 0 }, // Paid plans only
      $or: [
        { paypalPlanId: { $exists: false } },
        { paypalPlanId: null },
        { paypalPlanId: '' },
      ],
    });

    if (plansNeedingPayPal.length === 0) {
      console.log('✅ All paid plans already have PayPal integration!\n');
      
      // Show summary of all plans
      const allPlans = await SubscriptionPlan.find({ status: PlanStatus.ACTIVE });
      console.log('📋 Current Plans:\n');
      for (const plan of allPlans) {
        console.log(`   ${plan.name}:`);
        console.log(`      Price: $${plan.price / 100}/${plan.billingCycle === 'MONTHLY' ? 'month' : 'year'}`);
        console.log(`      PayPal: ${plan.paypalPlanId ? '✅ Configured' : '⚠️  Not configured (free plan)'}\n`);
      }
      
      process.exit(0);
    }

    console.log(`Found ${plansNeedingPayPal.length} paid plan(s) without PayPal integration:\n`);

    for (const plan of plansNeedingPayPal) {
      console.log(`📦 Processing: ${plan.name}...`);
      console.log(`   Price: $${plan.price / 100}/${plan.billingCycle === 'MONTHLY' ? 'month' : 'year'}`);

      try {
        // Create PayPal plan
        const paypalPlanId = await createPayPalPlan(
          plan.name,
          plan.description || `${plan.name} subscription plan`,
          plan.price / 100, // Convert cents to dollars
          plan.currency,
          plan.billingCycle
        );

        // Update our plan with PayPal plan ID
        plan.paypalPlanId = paypalPlanId;
        await plan.save();

        console.log(`   ✅ PayPal plan created: ${paypalPlanId}\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed to create PayPal plan: ${error.message}`);
        console.log('   Skipping this plan...\n');
      }
    }

    console.log('🎉 PayPal integration setup completed!\n');
    console.log('📋 Summary:');
    
    const allPlans = await SubscriptionPlan.find({ status: PlanStatus.ACTIVE });
    for (const plan of allPlans) {
      console.log(`   ${plan.name}: ${plan.paypalPlanId ? '✅ PayPal Configured' : '⚠️  No PayPal (free plan)'}`);
    }
    console.log('');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

setupPayPalPlans();

