"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { SocialLinks } from "./social-links";

export function MainFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-w-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-4">
              {t("common.app_name")}
            </h3>
            <p className="font-lato text-sm text-w-700">{t("footer.tagline")}</p>
            <div className="mt-5">
              <h4 className="font-cinzel font-semibold text-w-950 mb-3">{t("social.follow_us")}</h4>
              <SocialLinks />
            </div>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-w-950 mb-3">{t("footer.library")}</h4>
            <ul className="space-y-2 font-lato text-sm text-w-700">
              <li><Link href="/library" className="hover:text-w-950">{t("footer.browse_books")}</Link></li>
              <li><Link href="/library" className="hover:text-w-950">{t("footer.advanced_search")}</Link></li>
              <li><Link href="/library" className="hover:text-w-950">{t("footer.categories")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-w-950 mb-3">{t("footer.account")}</h4>
            <ul className="space-y-2 font-lato text-sm text-w-700">
              <li><Link href="/auth/login" className="hover:text-w-950">{t("footer.sign_in")}</Link></li>
              <li><Link href="/auth/register" className="hover:text-w-950">{t("footer.create_account")}</Link></li>
              <li><Link href="/auth/forgot-password" className="hover:text-w-950">{t("footer.forgot_password")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-w-200 pt-8 text-center">
          <p className="font-lato text-sm text-w-700">
            © {new Date().getFullYear()} Kingdom Library System. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
