"use client";

import React from "react";
import Link from "next/link";
import "./not-found.css";

interface NotFoundProps {
  title?: string; // Button text
  link?: string; // Redirect link
}

const NotFound: React.FC<NotFoundProps> = ({ title, link }) => {
  return (
    <div className="main_wrapper bg-background">
      <div className="main">
        {/* Antenna */}
        <div className="antenna dark:antenna">
          <div className="antenna_shadow dark:antenna_shadow"></div>
          <div className="a1 dark:a1"></div>
          <div className="a1d dark:a1d"></div>
          <div className="a2 dark:a2"></div>
          <div className="a2d dark:a2d"></div>
          <div className="a_base dark:a_base"></div>
        </div>

        {/* TV */}
        <div className="tv dark:tv">
          <div className="cruve">
            <svg
              className="curve_svg"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 189.929 189.929"
              xmlSpace="preserve"
            >
              <path
                d="M70.343,70.343c-30.554,30.553-44.806,72.7-39.102,115.635l-29.738,3.951C-5.442,137.659,11.917,86.34,49.129,49.13
                  C86.34,11.918,137.664-5.445,189.928,1.502l-3.95,29.738C143.041,25.54,100.895,39.789,70.343,70.343z"
              ></path>
            </svg>
          </div>

          <div className="display_div dark:display_div">
            <div className="screen_out dark:screen_out">
              <div className="screen_out1 dark:screen_out1">
                <div className="screen dark:screen">
                  <span className="notfound_text dark:notfound_text"> NOT FOUND</span>
                </div>
                <div className="screenM dark:screenM">
                  <span className="notfound_text dark:notfound_text"> NOT FOUND</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lines dark:lines">
            <div className="line1 dark:line1"></div>
            <div className="line2 dark:line2"></div>
            <div className="line3 dark:line3"></div>
          </div>

          <div className="buttons_div dark:buttons_div">
            <div className="b1 dark:b1">
              <div></div>
            </div>
            <div className="b2 dark:b2"></div>
            <div className="speakers dark:speakers">
              <div className="g1 dark:g1">
                <div className="g11 dark:g11"></div>
                <div className="g12 dark:g12"></div>
                <div className="g13 dark:g13"></div>
              </div>
              <div className="g dark:g"></div>
              <div className="g dark:g"></div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="bottom dark:bottom">
          <div className="base1 dark:base1"></div>
          <div className="base2 dark:base2"></div>
          <div className="base3 dark:base3"></div>
        </div>
      </div>

      {/* 404 Text */}
      <div className="text_404">
        <div className="text_4041">4</div>
        <div className="text_4042">0</div>
        <div className="text_4043">4</div>
      </div>

      {/* Optional Button */}
      {title && (
        <div className="mt-6">
          <Link href={link || "#"}>
            <button className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition">
              {title}
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotFound;
