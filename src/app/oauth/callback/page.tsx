"use client";

import {Suspense} from "react";
import OAuthCallback from "@/components/oauth-callback";

const Page = () => {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <OAuthCallback />
      </Suspense>
  )
}

export default Page