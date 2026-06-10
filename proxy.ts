import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export default auth((request) => {
  const { pathname } = request.nextUrl
  const session = request.auth
  const isWriterRoute = pathname.startsWith("/dashboard")
  const isAdminRoute = pathname.startsWith("/admin")

  if ((isWriterRoute || isAdminRoute) && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
