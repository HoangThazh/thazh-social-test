// components/Layout.js - Layout chung cho ứng dụng

import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Thazh Social</title>
        <meta name="description" content="Mạng xã hội Thazh Social" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-20"> {/* Thêm pt-20 để tránh nội dung bị che bởi Navbar cố định */}
        {children}
      </main>
      <footer className="bg-bluesky-card py-4 text-center text-bluesky-secondary border-t border-bluesky-light">
        <p>Thazh Social &copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}


