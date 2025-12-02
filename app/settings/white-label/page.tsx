'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';

export default function WhiteLabelPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    customDomain: '',
    removeClinicHubBranding: false,
    customEmailDomain: '',
    customLoginPage: false,
    customTermsUrl: '',
    customPrivacyUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Call API to save white label settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('White label settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">White Label Solution</h1>
            <p className="text-gray-600 mt-2">Complete customization and branding control</p>
          </div>
          <Tag variant="success">Enterprise Feature</Tag>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Branding */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Company Branding</h2>
          
          <div className="space-y-6">
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Your Company Name"
            />

            <Input
              label="Custom Domain"
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
              placeholder="app.yourcompany.com"
            />

            <Input
              label="Custom Email Domain"
              value={formData.customEmailDomain}
              onChange={(e) => setFormData({ ...formData, customEmailDomain: e.target.value })}
              placeholder="@yourcompany.com"
            />
          </div>
        </Card>

        {/* Branding Removal */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">ClinicHub Branding</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Remove ClinicHub Branding</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Hide all ClinicHub logos, names, and references from the application
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.removeClinicHubBranding}
                  onChange={(e) => setFormData({ ...formData, removeClinicHubBranding: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Custom Login Page</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use your own branded login page design
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customLoginPage}
                  onChange={(e) => setFormData({ ...formData, customLoginPage: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Legal Pages */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Custom Legal Pages</h2>
          
          <div className="space-y-4">
            <Input
              label="Custom Terms of Service URL"
              value={formData.customTermsUrl}
              onChange={(e) => setFormData({ ...formData, customTermsUrl: e.target.value })}
              placeholder="https://yourcompany.com/terms"
            />

            <Input
              label="Custom Privacy Policy URL"
              value={formData.customPrivacyUrl}
              onChange={(e) => setFormData({ ...formData, customPrivacyUrl: e.target.value })}
              placeholder="https://yourcompany.com/privacy"
            />
          </div>
        </Card>

        {/* Info */}
        <Card>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              White Label Benefits
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Present the platform as your own product</li>
              <li>• Build your brand with clients</li>
              <li>• Custom domain and email addresses</li>
              <li>• Remove all third-party branding</li>
              <li>• Enterprise-level customization</li>
            </ul>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            Save White Label Settings
          </Button>
        </div>
      </form>
    </Layout>
  );
}

