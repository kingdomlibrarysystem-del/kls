"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { SocialLinks } from "./social-links";

export function MainFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0b2136] py-12 px-4 dark:bg-[#05070f]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
          <div>
            <h3 className="font-cinzel text-lg font-semibold text-[#f6efe0] mb-4">
              {t("common.app_name")}
            </h3>
            <p className="font-lato text-sm text-[#f6efe0]/65">{t("footer.tagline")}</p>
            <div className="mt-5">
              <h4 className="font-cinzel font-semibold text-primary mb-3">{t("social.follow_us")}</h4>
              <SocialLinks className="flex-wrap justify-center md:justify-start" />
            </div>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-primary mb-3">{t("footer.library")}</h4>
            <ul className="space-y-2 font-lato text-sm text-[#f6efe0]/65">
              <li><Link href="/library" className="transition-colors hover:text-primary">{t("footer.browse_books")}</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-primary">{t("footer.advanced_search")}</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-primary">{t("footer.categories")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-primary mb-3">{t("footer.account")}</h4>
            <ul className="space-y-2 font-lato text-sm text-[#f6efe0]/65">
              <li><Link href="/#about" className="transition-colors hover:text-primary">{t("footer.about_us")}</Link></li>
              <li><Link href="/auth/login" className="transition-colors hover:text-primary">{t("footer.sign_in")}</Link></li>
              <li><Link href="/auth/register" className="transition-colors hover:text-primary">{t("footer.create_account")}</Link></li>
              <li><Link href="/auth/forgot-password" className="transition-colors hover:text-primary">{t("footer.forgot_password")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#f6efe0]/10 pt-8 text-center">
          <p className="font-lato text-sm text-[#f6efe0]/50">
            © {new Date().getFullYear()} Kingdom Library System. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
