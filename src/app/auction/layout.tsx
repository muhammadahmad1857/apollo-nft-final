"use client"
import Footer from '@/components/footer'
import Header from '@/components/header'
import React, { Suspense } from 'react'
const Layout = ({ children }: { children: React.ReactNode }) => {

  return (
    <Suspense fallback={<p>Loading...</p>}><Header/>{children}<Footer/></Suspense>

  )
}

export default Layout
