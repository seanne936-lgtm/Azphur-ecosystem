import React from 'react';
import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div style={{ backgroundColor: '#FDFBF7', color: '#050505', minHeight: '100vh', padding: '60px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header con Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #eaeaea', paddingBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={{ height: '45px', width: 'auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#050505' }}>AZPHUR INC.</h1>
              <p style={{ margin: 0, fontSize: '11px', letterSpacing: '1.5px', color: '#00838f', textTransform: 'uppercase' }}>
                Shaping Sustainable Possibilities
              </p>
            </div>
          </div>
          <Link href="/" style={{ color: '#00838f', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            ← Back to Home
          </Link>
        </div>

        {/* Content */}
        <div style={{ lineHeight: '1.7', fontSize: '15px', color: '#333333' }}>
          <h2 style={{ color: '#050505', fontSize: '22px', marginTop: '10px' }}>Terms & Conditions & Service Standards</h2>
          <p style={{ fontSize: '13px', color: '#666666', fontStyle: 'italic' }}>Last updated: June 2026</p>

          <p style={{ marginTop: '20px' }}>
            Welcome to <strong>AZPHUR INC.</strong> These Terms and Conditions govern your engagement with our sustainable digital ecosystems. We prioritize clarity, fairness, and mutual accountability to address potential customer concerns regarding service reliability, usage boundaries, and intellectual property.
          </p>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>1. Customer Agreements & Operational Scope</h3>
          <p>
            To ensure a secure environment for all users, AZPHUR enforces specific operational boundaries. The table below details user expectations versus prohibited behavior:
          </p>

          {/* Table */}
          <div style={{ overflowX: 'auto', margin: '20px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', color: '#00838f', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Area</th>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Customer Expectation</th>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>AZPHUR Policy Standard</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Platform Uptime</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Will access to AZPHUR services remain reliable?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Optimized continuously, though periodic maintenance may occur.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Support & Conduct</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>How are user requests and inquiries handled?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Handled professionally via official contact channels (azphur@gmail.com).</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Intellectual Property</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Are brand assets and code legally protected?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Strictly protected under international IP laws; unauthorized replication prohibited.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>2. Limitation of Liability & Dispute Resolution</h3>
          <p>
            AZPHUR INC. operates under standard corporate liability protections. In the event of disputes or service discrepancies, users agree to engage in good-faith electronic mediation through our designated administrative channels prior to pursuing external claims.
          </p>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>3. Corporate Inquiries</h3>
          <p>
            For any legal or formal clarification regarding these terms, please contact our administrative department:
          </p>
          <p style={{ marginTop: '10px' }}>
            <a href="mailto:azphur@gmail.com" style={{ color: '#00838f', textDecoration: 'none', fontWeight: 'bold' }}>
              azphur@gmail.com
            </a>
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', borderTop: '1px solid #eaeaea', paddingTop: '20px', textAlign: 'center', fontSize: '11px', color: '#666666' }}>
          © 2026 AZPHUR INC. All rights reserved.
        </div>

      </div>
    </div>
  );
}