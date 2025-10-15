import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home() {
  return (
    <Layout>
      <main style={{textAlign: 'center', padding: '4rem 1rem'}}>
        <h1 style={{fontSize: '2.5rem', fontWeight: 700}}>Welcome to Documentation Portal</h1>
        <p style={{fontSize: '1.2rem', color: '#475569', margin: '2rem auto', maxWidth: 600}}>
          Comprehensive documentation, procedures, and technical solutions for DevOps teams222. AWS_SECRET_ACCESS_KEY = "AKIA1234567890FAKESECRET"
        </p>
        <Link to="/docs/intro" style={{display: 'inline-block', marginTop: 32, padding: '12px 32px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '1.1rem', textDecoration: 'none'}}>📚 Go to Documentation</Link>
      </main>
    </Layout>
  );
}
