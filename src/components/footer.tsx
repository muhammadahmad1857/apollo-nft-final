"use client";

import Link from "next/link";
import Logo from "./Logo";
import Image from "next/image";

const socialLinks = [
  { image: "/X_logo_2023_(white).png",darkImg:"/x_logo_dark.png", href: "https://x.com/Blaqclouds_wy", label: "Twitter" },
  { image: "/THE ALLEY-01_edited(2).png",darkImg:"/The_Alley_dark.png", href: "https://www.thealley.io/group/blaqclouds-inc/discussion", label: "Alley" },
];

export default function Footer() {
  return (
    <footer className="bg-background text-primary py-10 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-16 flex-wrap">
        {/* Logo and Description */}
        <div className="flex-1 min-w-55">
          <div className="flex items-center gap-2 mb-3">
            <Logo width={110} height={50} />
          </div>
          <p className="text-sm mb-4">
            Redefining the boundaries of blockchain technology and decentralized finance.
          </p>
          <div className="flex gap-3">
            {socialLinks.map((social) => {
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image src={social.image} alt={social.label} width={40} height={40} className="dark:block hidden"/>
                  <Image src={social.darkImg} alt={social.label} width={40} height={40} className="block dark:hidden" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex-1 min-w-[160px]">
          <h3 className="font-bold text-lg mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li>
              <Link href="/marketplace" className="hover:underline">Marketplace</Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            </li>
            <li>
              <Link href="/faq" className="hover:underline">FAQ</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Our Ecosystem */}
        <div className="flex-1 min-w-[160px]">
          <h3 className="font-bold text-lg mb-3">Our Ecosystem</h3>
          <ul className="space-y-2">
            <li><Link href="https://zeuschain.io" className="hover:underline" target="_blank">ZEUS Chain</Link></li>
            <li><Link href="https://zeusx.io" className="hover:underline" target="_blank">ZEUSx.io</Link></li>
            <li><Link href="https://shopwithcrypto.io" className="hover:underline" target="_blank">ShopwithCrypto</Link></li>
            <li><Link href="https://thealley.io" className="hover:underline" target="_blank">theAlley</Link></li>
            <li><Link href="https://blaqpay.io" className="hover:underline" target="_blank">BLAQpay</Link></li>
            <li><Link href="https://ampleswap.com" className="hover:underline" target="_blank">AmpleSWAP</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="flex-1 min-w-[160px]">
          <h3 className="font-bold text-lg mb-3">Company</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:underline">BLAQclouds, Inc.</Link></li>
            <li><a href="mailto:hello@blaqclouds.io" className="hover:underline">hello@blaqclouds.io</a></li>
            <li><a href="tel:+16106214804" className="hover:underline">610-621-4804</a></li>
            <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 mt-8 pt-4 text-center text-xs space-y-2 md:space-y-0 md:flex md:flex-col md:items-center">
        <span>© 2026 Apollo NFT · Powered by BLAQclouds, Inc. All rights reserved.</span>
        <span>
          BLAQclouds, Inc. is registered with FINCEN as an MSB (Money Service Business). BSA ID: 31000313564202
        </span>
        <span className="flex flex-wrap justify-center gap-1">
          <Link href="https://shopwithcrypto.io" target="_blank" className="text-blue-400 hover:underline">ShopwithCrypto.io</Link>,
          <Link href="https://dinewithcrypto.io" target="_blank" className="text-blue-400 hover:underline">DinewithCrypto.io</Link>,
          <Link href="https://zeuseenergy.io" target="_blank" className="text-blue-400 hover:underline">ZEUSEenergy.io</Link>,
          <Link href="https://bitnotify.io" target="_blank" className="text-blue-400 hover:underline">BitNotify.io</Link>,
          <Link href="https://ampleswap.com" target="_blank" className="text-blue-400 hover:underline">AmpleSwap.com</Link>,
          <Link href="https://zeuschainscan.io" target="_blank" className="text-blue-400 hover:underline">ZEUSChainScan.io</Link>,
          <Link href="https://apolloscan.io" target="_blank" className="text-blue-400 hover:underline">Apolloscan.io</Link>,
          <Link href="https://blaqpay.io" target="_blank" className="text-blue-400 hover:underline">BLAQpay.io</Link>,
          <Link href="https://zxusd.io" target="_blank" className="text-blue-400 hover:underline">ZXUSD.io</Link>
        </span>
      </div>
    </footer>
  );
}
