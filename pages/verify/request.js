// pages/verify/request.js - Trang yêu cầu xác minh tài khoản

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import supabase from '../../utils/supabase';

export default function VerifyRequest() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    occupation: '',
    website: '',
    socialLinks: '',
    reason: '',
    documents: null
  });
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);

      if (profileData?.is_verified) {
        setMessage('Tài khoản của bạn đã được xác minh.');
      } else if (profileData?.verification_status === 'pending') {
        setMessage('Yêu cầu xác minh của bạn đang được xem xét.');
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'documents') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let documentUrl = null;

      // Upload document if provided
      if (formData.documents) {
        const fileExt = formData.documents.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, formData.documents);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(fileName);

        documentUrl = publicUrl;
      }

      // Create verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          occupation: formData.occupation,
          website: formData.website,
          social_links: formData.socialLinks,
          reason: formData.reason,
          document_url: documentUrl,
          status: 'pending'
        });

      if (error) throw error;

      // Update profile status
      await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('id', user.id);

      setMessage('Yêu cầu xác minh đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong vòng 3-5 ngày làm việc.');
      
      // Reset form
      setFormData({
        fullName: '',
        occupation: '',
        website: '',
        socialLinks: '',
        reason: '',
        documents: null
      });

    } catch (error) {
      console.error('Error submitting verification request:', error);
      setMessage('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bluesky-accent mx-auto mb-4"></div>
          <p className="text-bluesky-secondary">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-bluesky-primary mb-2">Yêu cầu xác minh tài khoản</h1>
            <p className="text-bluesky-secondary">
              Tích xanh giúp người khác biết tài khoản của bạn là chính thức và đáng tin cậy.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-md mb-6 ${
              message.includes('thành công') || message.includes('đã được xác minh') || message.includes('đang được xem xét')
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {!profile?.is_verified && profile?.verification_status !== 'pending' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Họ và tên đầy đủ *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Nghề nghiệp/Chức vụ *
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  placeholder="Ví dụ: CEO tại ABC Company, Nghệ sĩ, Nhà báo..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Website chính thức
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Liên kết mạng xã hội khác
                </label>
                <textarea
                  name="socialLinks"
                  value={formData.socialLinks}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  placeholder="Facebook, Instagram, Twitter, LinkedIn... (mỗi link một dòng)"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Lý do yêu cầu xác minh *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  placeholder="Giải thích tại sao bạn cần được xác minh (ví dụ: là người nổi tiếng, có ảnh hưởng trong lĩnh vực nào đó...)"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bluesky-secondary mb-2">
                  Tài liệu xác minh
                </label>
                <input
                  type="file"
                  name="documents"
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-xs text-bluesky-secondary mt-1">
                  Tải lên CMND/CCCD, bằng cấp, hoặc tài liệu chứng minh danh tính (PDF, JPG, PNG, DOC)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-bluesky-primary mb-2">Tiêu chí xác minh:</h3>
                <ul className="text-sm text-bluesky-secondary space-y-1">
                  <li>• Tài khoản phải có hoạt động thường xuyên</li>
                  <li>• Là người nổi tiếng, có ảnh hưởng trong lĩnh vực của mình</li>
                  <li>• Có thông tin cá nhân đầy đủ và chính xác</li>
                  <li>• Tuân thủ các quy định của cộng đồng</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-bluesky-accent text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu xác minh'}
              </button>
            </form>
          )}

          {(profile?.is_verified || profile?.verification_status === 'pending') && (
            <div className="text-center">
              <button
                onClick={() => router.push('/profile')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Quay lại trang cá nhân
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

