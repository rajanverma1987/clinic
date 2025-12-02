'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function BrandingPage() {
  const [formData, setFormData] = useState({
    clinicName: '',
    logo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    favicon: '',
    customDomain: '',
    footerText: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Call API to save branding settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Branding settings saved successfully!');
    } catch (error) {
      alert('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Custom Branding</h1>
        <p className="text-gray-600 mt-2">Customize the look and feel of your clinic's portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Branding */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Basic Branding</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Clinic Name"
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder="Your Clinic Name"
            />

            <Input
              label="Custom Domain"
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
              placeholder="clinic.yourdomain.com"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter URL of your logo image (recommended: 200x60px PNG)
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon URL
            </label>
            <Input
              value={formData.favicon}
              onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
              placeholder="https://example.com/favicon.ico"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter URL of your favicon (recommended: 32x32px ICO or PNG)
            </p>
          </div>
        </Card>

        {/* Color Scheme */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Color Scheme</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
              <div 
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: formData.primaryColor }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
              <div 
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: formData.secondaryColor }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  placeholder="#8B5CF6"
                  className="flex-1"
                />
              </div>
              <div 
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: formData.accentColor }}
              />
            </div>
          </div>
        </Card>

        {/* Footer Customization */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Footer Customization</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Footer Text
            </label>
            <textarea
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="© 2024 Your Clinic Name. All rights reserved."
            />
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            Save Branding Settings
          </Button>
        </div>
      </form>
    </Layout>
  );
}

