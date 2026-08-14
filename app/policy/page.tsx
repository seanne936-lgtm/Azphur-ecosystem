import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
          <h2 style={{ color: '#050505', fontSize: '22px', marginTop: '10px' }}>Privacy Policy & Customer Data Governance</h2>
          <p style={{ fontSize: '13px', color: '#666666', fontStyle: 'italic' }}>Last updated: June 2026</p>

          <p style={{ marginTop: '20px' }}>
            At <strong>AZPHUR INC.</strong>, we understand that customer trust is the core foundation of our technological and sustainable initiatives. This Privacy Policy addresses common customer concerns regarding data privacy, tracking transparency, and how we handle, process, and protect your personal information across our platforms.
          </p>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>1. Information Collected & Customer Concerns</h3>
          <p>
            We believe in complete transparency. Customers frequently express concern over what data is collected and why. The table below outlines our data practices and mitigation measures:
          </p>

          {/* Table */}
          <div style={{ overflowX: 'auto', margin: '20px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', color: '#00838f', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Data Type</th>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Customer Concern Addressed</th>
                  <th style={{ padding: '12px', border: '1px solid #e0e0e0' }}>AZPHUR Commitment</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Identifiers (Email)</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Will my email be sold to third-party advertisers?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Never shared or commercialized. Used strictly for support.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Browsing Telemetry</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Are my online activities tracked invasively?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Anonymized diagnostic tracking exclusively for system stability.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0', fontWeight: 'bold' }}>Administrative Logs</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Is secure core access vulnerable to leaks?</td>
                  <td style={{ padding: '12px', border: '1px solid #e0e0e0' }}>Protected via advanced encryption and strict access thresholds.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>2. Customer Rights & Control</h3>
          <p>
            Every AZPHUR customer maintains sovereign control over their data profile. You reserve the absolute right to request access, correction, or permanent deletion of your communications and registered attributes by contacting us directly.
          </p>

          <h3 style={{ color: '#050505', fontSize: '18px', marginTop: '30px' }}>3. Direct Contact</h3>
          <p>
            If you have any specific inquiries regarding privacy safeguards, reach out to our privacy administration desk:
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