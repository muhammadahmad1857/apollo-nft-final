'use client'

import Logo from "./Logo";
import { Twitter, Mail } from "lucide-react";

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Mail, href: "mailto:hello@apollonft.io", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-background text-primary py-10 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* Logo and Description */}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <Logo width={110} height={50} />
            <span className="text-2xl font-bold">apollonft</span>
          </div>
          <p className="text-sm mb-4">
            Redefining the boundaries of blockchain technology and decentralized finance.
          </p>
          <div className="flex gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex-1 min-w-[180px]">
          <h3 className="font-bold text-lg mb-2">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/" className="hover:underline">Home</a></li>
            <li><a href="/marketplace" className="hover:underline">Marketplace</a></li>
            <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
          </ul>
        </div>

        {/* Our Ecosystem */}
        <div className="flex-1 min-w-[180px]">
          <h3 className="font-bold text-lg mb-2">Our Ecosystem</h3>
          <ul className="space-y-2">
            <li>ZEUS Chain</li>
            <li>ZEUSx.io</li>
            <li>ShopwithCrypto</li>
            <li>theAlley</li>
            <li>BLAQpay</li>
            <li>AmpleSWAP</li>
          </ul>
        </div>

        {/* Company */}
        <div className="flex-1 min-w-[180px]">
          <h3 className="font-bold text-lg mb-2">Company</h3>
          <ul className="space-y-2">
            <li>apollonft, Inc.</li>
            <li>hello@apollonft.io</li>
            <li>610-621-4804</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 mt-8 pt-4 text-center text-xs">
        © 2026 Apollo Cash · Powered by apollonft, Inc. All rights reserved.
        <br />
        <span className="block mt-2">
          apollonft, Inc. is registered with FINCEN as an MSB (Money Service Business). The BSA ID registration number awarded by FINCEN is 31000313564202 and is used for
          <a href="https://ShopwithCrypto.io" className="text-blue-400 hover:underline mx-1">ShopwithCrypto.io</a>,
          <a href="https://DinewithCrypto.io" className="text-blue-400 hover:underline mx-1">DinewithCrypto.io</a>,
          <a href="https://ZEUSEenergy.io" className="text-blue-400 hover:underline mx-1">ZEUSEenergy.io</a>,
          <a href="https://BitNotify.io" className="text-blue-400 hover:underline mx-1">BitNotify.io</a>,
          <a href="https://Ampleswap.com" className="text-blue-400 hover:underline mx-1">Ampleswap.com</a>,
          <a href="https://ZEUSChainScan.io" className="text-blue-400 hover:underline mx-1">ZEUSChainScan.io</a>,
          <a href="https://Apolloscan.io" className="text-blue-400 hover:underline mx-1">Apolloscan.io</a>,
          <a href="https://BLAQpay.io" className="text-blue-400 hover:underline mx-1">BLAQpay.io</a> and
          <a href="https://ZXUSD.io" className="text-blue-400 hover:underline mx-1">ZXUSD.io</a>.
        </span>
      </div>
    </footer>
  );
}
