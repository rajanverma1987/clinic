/**
 * Barcode Scanner Component
 * For inventory and lab barcode scanning
 * Based on NEW-PLANS.md requirements
 */

'use client';

import { Button } from '@/components/ui/Button';
import { useState, useRef, useEffect } from 'react';
import { generateBarcode } from '@/lib/barcode/barcode-scanner';
import { logger } from '@/lib/utils/logger.js';

export function BarcodeScanner({ onScan, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      onError?.(error);
      logger.error('Error accessing camera:', error);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Note: Actual barcode scanning would require a library like QuaggaJS or ZXing
  // This is a UI component - scanning logic would be implemented with a library

  return (
    <div className="barcode-scanner">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-md mx-auto"
        style={{ display: isScanning ? 'block' : 'none' }}
      />
      {!isScanning && (
        <Button
          variant='primary'
          size='sm'
          onClick={startScanning}
        >
          Start Scanning
        </Button>
      )}
      {isScanning && (
        <Button
          variant='danger'
          size='sm'
          onClick={stopScanning}
        >
          Stop Scanning
        </Button>
      )}
    </div>
  );
}

export default BarcodeScanner;
