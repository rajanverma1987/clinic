# Performance Optimization Guide

**Date:** January 2025  
**Status:** Implementation Guide

## Database Optimization

### Connection Pooling
- **Configured:** MongoDB connection pooling with configurable pool sizes
- **Settings:**
  - `maxPoolSize`: 20 (configurable via `MONGODB_MAX_POOL_SIZE`)
  - `minPoolSize`: 5 (configurable via `MONGODB_MIN_POOL_SIZE`)
  - `maxIdleTimeMS`: 30 seconds
  - Connection reuse for better performance

### Database Indexes

#### Critical Indexes Implemented

1. **Patient Model**
   - `tenantId + patientId` (unique)
   - Text search index on `firstName`, `lastName`, `patientId`, `phone`
   - `tenantId + status`

2. **Appointment Model**
   - `tenantId + appointmentDate + status`
   - `tenantId + doctorId + appointmentDate`
   - `tenantId + patientId + appointmentDate`
   - `tenantId + reminderScheduledAt + reminderSent + status` (for reminders)

3. **Invoice Model**
   - `tenantId + invoiceNumber` (unique)
   - `tenantId + patientId + createdAt`
   - `tenantId + status + dueDate` (for payment reminders)
   - `tenantId + invoiceDate`

4. **Prescription Model**
   - `tenantId + prescriptionNumber` (unique)
   - `tenantId + status + validUntil` (for refill reminders)
   - `tenantId + refillsAllowed + refillsUsed`

5. **Lab Models**
   - `LabOrder`: `tenantId + patientId + orderedAt`
   - `LabResult`: `tenantId + orderId`, `tenantId + patientId + reportedAt`

6. **Inventory Models**
   - `StockBatch`: `tenantId + medicineId + status`, `tenantId + dates.expiry`
   - `StockTransaction`: `tenantId + type + createdAt`

### Query Optimization Best Practices

#### 1. Use `.lean()` for Read-Only Queries
```javascript
// ✅ Good - Returns plain JavaScript objects (faster)
const patients = await Patient.find(filter).lean();

// ❌ Avoid - Returns Mongoose documents (slower, more memory)
const patients = await Patient.find(filter);
```

#### 2. Use Projections to Limit Fields
```javascript
// ✅ Good - Only fetch needed fields
const patient = await Patient.findById(id)
  .select('firstName lastName email phone')
  .lean();

// ❌ Avoid - Fetching all fields
const patient = await Patient.findById(id).lean();
```

#### 3. Use Pagination for List Queries
```javascript
// ✅ Good - Always paginate
const { page, limit } = getPaginationParams(query);
const items = await Model.find(filter)
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();
```

#### 4. Use Compound Indexes for Common Queries
```javascript
// Index matches query pattern
AppointmentSchema.index({ tenantId: 1, status: 1, appointmentDate: 1 });

// Query uses index efficiently
const appointments = await Appointment.find({
  tenantId,
  status: 'scheduled',
  appointmentDate: { $gte: startDate, $lte: endDate }
}).lean();
```

#### 5. Avoid N+1 Queries
```javascript
// ✅ Good - Use populate or aggregation
const appointments = await Appointment.find(filter)
  .populate('patientId', 'firstName lastName')
  .populate('doctorId', 'firstName lastName')
  .lean();

// ❌ Avoid - Multiple queries in loop
for (const apt of appointments) {
  const patient = await Patient.findById(apt.patientId); // N+1 problem
}
```

#### 6. Use Aggregation for Complex Queries
```javascript
// ✅ Good - Single aggregation query
const stats = await Appointment.aggregate([
  { $match: { tenantId, status: 'completed' } },
  { $group: { _id: '$doctorId', count: { $sum: 1 } } }
]);
```

## API Response Optimization

### 1. Response Size Limits
- Maximum 50 items per page (configurable)
- Use pagination for all list endpoints
- Limit nested data depth

### 2. Caching Strategy
- **Redis** (optional): Cache frequently accessed data
- Cache keys: `tenant:${tenantId}:patients:${patientId}`
- TTL: 5-15 minutes for read-heavy data

### 3. Compression
- Enable gzip compression in Next.js
- Compress API responses > 1KB

## Frontend Optimization

### 1. Code Splitting
- Use dynamic imports for heavy components
- Lazy load routes
- Split vendor bundles

### 2. Image Optimization
- Use Next.js Image component
- WebP format with fallbacks
- Lazy loading for images

### 3. Bundle Size
- Tree shaking enabled
- Remove unused dependencies
- Monitor bundle size with `npm run build`

## Monitoring & Metrics

### Key Metrics to Track
1. **Database:**
   - Query execution time (> 100ms is slow)
   - Connection pool usage
   - Index hit ratio

2. **API:**
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate

3. **Frontend:**
   - Page load time
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)

## Performance Checklist

- [x] Connection pooling configured
- [x] Critical indexes added
- [x] Query optimization patterns documented
- [ ] Redis caching implemented (optional)
- [ ] Performance monitoring setup
- [ ] Load testing completed
- [ ] Database query profiling enabled

## Environment Variables

```env
# MongoDB Connection Pool
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=5

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Performance Monitoring
ENABLE_QUERY_PROFILING=false
SLOW_QUERY_THRESHOLD_MS=100
```

## Next Steps

1. Implement Redis caching for frequently accessed data
2. Set up query profiling in development
3. Add performance monitoring (e.g., New Relic, DataDog)
4. Conduct load testing
5. Optimize slow queries identified in production
