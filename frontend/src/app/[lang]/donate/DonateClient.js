"use client";

import { useState } from 'react';
import Head from 'next/head';

export default function DonateClient({ dict, lang }) {
  const [ten, setTen] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(dict.donate.sending + ten + '...');
    
    try {
      // Example of connecting to the Java backend
      const response = await fetch('http://localhost:8080/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: ten }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(dict.donate.success.replace('{name}', data.name));
      } else {
        setResult(dict.donate.error1.replace('{name}', ten));
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      setResult(dict.donate.error2.replace('{name}', ten));
    }
  };

  return (
    <>
      <Head>
        <title>{dict.donate.title}</title>
      </Head>
      <div style={{ backgroundColor: '#161922', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#222', padding: '40px', borderRadius: '10px', width: '80%', maxWidth: '500px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
          <h1 style={{ marginBottom: '20px', color: '#ffcc74' }}>{dict.donate.heading}</h1>
          <p style={{ marginBottom: '20px' }}>{dict.donate.desc}</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label htmlFor="ten" style={{ textAlign: 'left' }}>{dict.donate.name_label}</label>
            <textarea 
              id="ten" 
              name="ten" 
              rows="4" 
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#333', color: 'white' }}
              placeholder={dict.donate.name_placeholder}
              required
            />
            <button 
              type="submit" 
              style={{ 
                padding: '10px', 
                backgroundColor: 'orangered', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
            >
              {dict.donate.submit}
            </button>
          </form>
          
          {result && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
              {result}
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <a href={`/${lang}`} style={{ color: 'lightblue', textDecoration: 'none' }}>{dict.donate.back}</a>
          </div>
        </div>
      </div>
    </>
  );
}
