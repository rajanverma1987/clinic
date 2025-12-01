/**
 * Check subscription plans in database
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

import connectDB from '../lib/db/connection';
import SubscriptionPlan from '../models/SubscriptionPlan';

async function checkPlans() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const plans = await SubscriptionPlan.find().lean();
    
    console.log(`Found ${plans.length} subscription plan(s):\n`);
    console.log('═'.repeat(80));
    
    if (plans.length === 0) {
      console.log('❌ No subscription plans found in database!\n');
      console.log('💡 Run: npm run seed:plans\n');
    } else {
      plans.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.name}`);
        console.log(`   ID: ${plan._id}`);
        console.log(`   Price: $${(plan.price / 100).toFixed(2)}/${plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}`);
        console.log(`   Status: ${plan.status}`);
        console.log(`   Features: ${plan.features.length}`);
        console.log(`   Popular: ${plan.isPopular ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

checkPlans();

