"use client";

import { useState, useMemo } from "react";

type DocStatus = "new" | "updated" | "pinned" | null;

interface Doc {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  status: DocStatus;
  readTime?: string;
  tags?: string[];
}

interface Category {
  id: string;
  label: string;
  description: string;
  docs: Doc[];
}

const CATEGORIES: Category[] = [
  {
    id: "announcements",
    label: "Announcements",
    description: "Latest updates from JETSET HQ — promotions, network changes, and important notices.",
    docs: [
      {
        id: "ann-1",
        title: "Summer Surge Campaign — All Studios",
        description: "HQ is launching a network-wide membership push for July–August. All studios should display the Summer Surge signage by June 30. Digital assets are available in Resources.",
        date: "Jun 20, 2026",
        author: "HQ Marketing",
        status: "pinned",
        readTime: "3 min",
        tags: ["Campaign", "Marketing"],
      },
      {
        id: "ann-2",
        title: "New Studio Opening — Nashville West End (Jul 12)",
        description: "We're proud to welcome our 47th studio location. Franchisees should coordinate with the Nashville team on sub requests and equipment transfers in the weeks leading up to opening.",
        date: "Jun 18, 2026",
        author: "HQ Operations",
        status: "new",
        readTime: "2 min",
        tags: ["Expansion", "Studios"],
      },
      {
        id: "ann-3",
        title: "Mindbody Platform Update — June 28 Maintenance Window",
        description: "Mindbody will be performing scheduled maintenance on June 28 from 2–5 AM ET. Booking integrations and the check-in kiosk may be unavailable during this window. Paper sign-in sheets are in your supply closet.",
        date: "Jun 15, 2026",
        author: "HQ Technology",
        status: "updated",
        readTime: "2 min",
        tags: ["Technology", "Mindbody"],
      },
      {
        id: "ann-4",
        title: "Q3 Franchise Calls — Schedule Released",
        description: "The Q3 franchisee call schedule has been posted. All lead instructors and studio managers are expected to join the regional call for their market. Links and dial-in numbers are in the calendar invite sent June 10.",
        date: "Jun 10, 2026",
        author: "HQ Franchise Relations",
        status: null,
        readTime: "1 min",
        tags: ["Franchise"],
      },
      {
        id: "ann-5",
        title: "Updated Referral Bonus Structure — Effective July 1",
        description: "Starting July 1, the member referral bonus increases from $20 to $30 credit. Update your front-desk scripts and any printed referral cards. The digital referral flow in Mindbody updates automatically.",
        date: "Jun 5, 2026",
        author: "HQ Sales",
        status: null,
        readTime: "2 min",
        tags: ["Sales", "Members"],
      },
      {
        id: "ann-6",
        title: "Holiday Closures — July 4th Network Guidance",
        description: "Studios may choose to close or run a reduced schedule on July 4. All closures and schedule changes must be entered in Mindbody by June 25 and communicated to members via the standard email template in Resources.",
        date: "Jun 3, 2026",
        author: "HQ Operations",
        status: null,
        readTime: "1 min",
        tags: ["Operations"],
      },
    ],
  },
  {
    id: "manuals",
    label: "Operations Manual",
    description: "Standard operating procedures for running your studio — from opening through closing and everything in between.",
    docs: [
      {
        id: "man-1",
        title: "Studio Opening & Closing Procedures",
        description: "Step-by-step checklist for daily open and close. Covers alarm codes, reformer inspection, music setup, towel count, and register close-out. Required reading for all front-desk staff.",
        date: "May 1, 2026",
        author: "HQ Operations",
        status: "updated",
        readTime: "12 min",
        tags: ["Daily Ops"],
      },
      {
        id: "man-2",
        title: "Reformer & Equipment Maintenance SOP",
        description: "Monthly and quarterly maintenance schedules for all reformer models in the JETSET fleet. Includes spring tension checks, carriage rail lubrication, footbar adjustment, and vendor contact info for emergency repairs.",
        date: "Apr 15, 2026",
        author: "HQ Facilities",
        status: null,
        readTime: "18 min",
        tags: ["Equipment"],
      },
      {
        id: "man-3",
        title: "Member Check-In & Front-Desk Protocol",
        description: "How to process walk-in check-ins, handle late arrivals, manage waitlists, and resolve Mindbody booking conflicts. Also covers the guest policy and complimentary class guidelines.",
        date: "Mar 20, 2026",
        author: "HQ Operations",
        status: null,
        readTime: "10 min",
        tags: ["Front Desk", "Members"],
      },
      {
        id: "man-4",
        title: "Emergency & Safety Protocols",
        description: "Fire evacuation routes, injury response, AED location requirements, incident reporting, and the after-hours emergency contact chain. Every studio is required to post a printed copy in the instructor room.",
        date: "Jan 8, 2026",
        author: "HQ Risk & Compliance",
        status: null,
        readTime: "15 min",
        tags: ["Safety"],
      },
      {
        id: "man-5",
        title: "Cleaning & Sanitation Standards",
        description: "Post-class reformer wipe-down, mat cleaning rotation, bathroom sanitation schedule, and approved cleaning product list. Audited quarterly by your regional manager.",
        date: "Feb 14, 2026",
        author: "HQ Operations",
        status: null,
        readTime: "8 min",
        tags: ["Sanitation"],
      },
      {
        id: "man-6",
        title: "Retail & Merchandise Procedures",
        description: "Inventory receiving, display standards, pricing policy, and end-of-month count process. Covers all JETSET apparel, accessories, and grip socks.",
        date: "Mar 1, 2026",
        author: "HQ Retail",
        status: "updated",
        readTime: "9 min",
        tags: ["Retail"],
      },
    ],
  },
  {
    id: "training",
    label: "Training & Development",
    description: "Onboarding guides, certification programs, and ongoing development resources for instructors and staff.",
    docs: [
      {
        id: "trn-1",
        title: "New Instructor Onboarding Guide",
        description: "Everything a newly hired instructor needs for their first 30 days — scheduling requirements, shadowing protocol, music BPM guidelines, cueing standards, and how to access the instructor portal.",
        date: "Apr 10, 2026",
        author: "HQ Training",
        status: "new",
        readTime: "20 min",
        tags: ["Onboarding"],
      },
      {
        id: "trn-2",
        title: "JETSET Reformer Certification Program (Level 1 & 2)",
        description: "The official cert program curriculum. Level 1 covers foundations; Level 2 covers advanced sequencing and modifications. Required for all instructors within 60 days of hire. Exam proctored by your regional trainer.",
        date: "Jan 20, 2026",
        author: "HQ Education",
        status: null,
        readTime: "35 min",
        tags: ["Certification"],
      },
      {
        id: "trn-3",
        title: "Subbing Protocol & Substitute Instructor Standards",
        description: "How to post, claim, and fill sub shifts. Covers the 48-hour notice requirement, sub approval chain, and how to ensure a sub meets the minimum certification level for a given class format.",
        date: "Feb 28, 2026",
        author: "HQ Operations",
        status: null,
        readTime: "7 min",
        tags: ["Scheduling"],
      },
      {
        id: "trn-4",
        title: "Customer Experience & Service Standards",
        description: "The JETSET member experience philosophy — from greeting at the door to post-class follow-up. Includes scripts for common interactions, handling complaints, and recognizing members by name.",
        date: "Mar 5, 2026",
        author: "HQ Training",
        status: null,
        readTime: "14 min",
        tags: ["Customer Experience"],
      },
      {
        id: "trn-5",
        title: "Sales Conversion Training for Front Desk",
        description: "How to convert intro-class visitors into members. Covers the tour flow, membership pitch structure, handling objections, and how to log prospects in Mindbody for follow-up.",
        date: "May 15, 2026",
        author: "HQ Sales",
        status: "updated",
        readTime: "11 min",
        tags: ["Sales", "Front Desk"],
      },
      {
        id: "trn-6",
        title: "Instructor Feedback & Performance Review Process",
        description: "How class ratings are collected from members, how instructors can view their own scores, and how studio leads should conduct the quarterly instructor review meeting.",
        date: "Apr 22, 2026",
        author: "HQ HR",
        status: null,
        readTime: "9 min",
        tags: ["Performance"],
      },
    ],
  },
  {
    id: "brand",
    label: "Brand Standards",
    description: "Visual identity, tone of voice, and brand guidelines every JETSET touchpoint must follow.",
    docs: [
      {
        id: "brd-1",
        title: "JETSET Brand Identity Guide (2026)",
        description: "Logo usage, color palette, typography, and spacing rules. Includes approved and prohibited logo treatments, minimum clear-space requirements, and asset download links.",
        date: "Jan 1, 2026",
        author: "HQ Marketing",
        status: "updated",
        readTime: "22 min",
        tags: ["Brand", "Design"],
      },
      {
        id: "brd-2",
        title: "Social Media Guidelines for Studio Accounts",
        description: "What studios can and cannot post to their local Instagram and Facebook accounts. Covers approval requirements for paid posts, hashtag standards, story templates, and the photography grid look.",
        date: "Feb 5, 2026",
        author: "HQ Marketing",
        status: null,
        readTime: "13 min",
        tags: ["Social Media"],
      },
      {
        id: "brd-3",
        title: "Photography & Video Standards",
        description: "Shot list for a compliant studio photo set — lighting, angles, model waiver requirements, and how to submit photos for HQ approval before publishing. Also covers video specs for Reels and TikTok.",
        date: "Mar 12, 2026",
        author: "HQ Creative",
        status: null,
        readTime: "10 min",
        tags: ["Photography"],
      },
      {
        id: "brd-4",
        title: "Uniform & Dress Code Policy",
        description: "Required attire for instructors and front-desk staff. Covers the branded top mandate, acceptable bottoms, grip sock requirements on the floor, and the guest-facing appearance standard.",
        date: "Jan 15, 2026",
        author: "HQ HR",
        status: null,
        readTime: "5 min",
        tags: ["HR", "Uniform"],
      },
      {
        id: "brd-5",
        title: "Signage & In-Studio Display Standards",
        description: "Placement guidelines for window decals, class schedule boards, membership pricing displays, and promotional signage. All custom signage must be approved by HQ Marketing before installation.",
        date: "Feb 20, 2026",
        author: "HQ Marketing",
        status: null,
        readTime: "8 min",
        tags: ["Signage"],
      },
    ],
  },
  {
    id: "policies",
    label: "HR & Policies",
    description: "Employee policies, compliance requirements, and people-management frameworks for studio leaders.",
    docs: [
      {
        id: "pol-1",
        title: "JETSET Employee Handbook (2026 Edition)",
        description: "The full handbook covering employment classification, at-will status, anti-harassment policy, code of conduct, progressive discipline, and termination procedures.",
        date: "Jan 1, 2026",
        author: "HQ HR",
        status: "updated",
        readTime: "45 min",
        tags: ["HR", "Compliance"],
      },
      {
        id: "pol-2",
        title: "PTO, Leave & Scheduling Policy",
        description: "How PTO accrues by employment type, the request and approval process, blackout date rules, leave of absence guidance, and what happens to PTO at separation.",
        date: "Jan 1, 2026",
        author: "HQ HR",
        status: null,
        readTime: "12 min",
        tags: ["HR"],
      },
      {
        id: "pol-3",
        title: "Instructor Compensation Structure",
        description: "Base rate schedule, headcount bonuses, class-size tiers, and the premium pay policy for specialty formats. Also covers how pay is calculated when a class is cancelled or capped.",
        date: "Mar 1, 2026",
        author: "HQ HR",
        status: "updated",
        readTime: "10 min",
        tags: ["Compensation"],
      },
      {
        id: "pol-4",
        title: "Non-Compete & Moonlighting Policy",
        description: "Defines what constitutes a competing studio, the 6-month post-employment non-solicitation window, and how instructors must disclose outside teaching engagements.",
        date: "Jan 1, 2026",
        author: "HQ Legal",
        status: null,
        readTime: "8 min",
        tags: ["Legal", "HR"],
      },
      {
        id: "pol-5",
        title: "Data Privacy & Member Information Policy",
        description: "How member personal data (email, payment, class history) must be stored, shared, and protected. Covers CCPA compliance obligations, breach notification requirements, and prohibited uses of member data.",
        date: "Jan 20, 2026",
        author: "HQ Legal",
        status: null,
        readTime: "14 min",
        tags: ["Privacy", "Compliance"],
      },
    ],
  },
  {
    id: "resources",
    label: "Resources & Templates",
    description: "Ready-to-use templates, forms, checklists, and brand assets for day-to-day studio operations.",
    docs: [
      {
        id: "res-1",
        title: "Monthly Inventory Count Sheet",
        description: "Printable and Google Sheets version. Use this at end-of-month to log all apparel, grip socks, water bottles, and consumables. Submit via the ops portal by the 3rd of each month.",
        date: "Jun 1, 2026",
        author: "HQ Retail",
        status: "updated",
        readTime: "—",
        tags: ["Template", "Inventory"],
      },
      {
        id: "res-2",
        title: "Member Welcome Email Sequence",
        description: "Three-email drip sequence triggered on new membership signup — welcome message, first-class tips, and a 30-day check-in. Customizable tokens for studio name and instructor name.",
        date: "Apr 5, 2026",
        author: "HQ Marketing",
        status: null,
        readTime: "—",
        tags: ["Template", "Email"],
      },
      {
        id: "res-3",
        title: "Incident Report Form",
        description: "Use for any member injury, equipment damage, or on-site incident. Submit to your regional manager and HQ Risk within 24 hours of the event. Keep a copy in the studio file.",
        date: "Jan 1, 2026",
        author: "HQ Risk & Compliance",
        status: null,
        readTime: "—",
        tags: ["Form", "Safety"],
      },
      {
        id: "res-4",
        title: "Class Schedule Planning Template",
        description: "Spreadsheet template for mapping out your weekly class roster, instructor assignments, and room capacity. Designed to flag conflicts and calculate projected revenue per time slot.",
        date: "May 10, 2026",
        author: "HQ Operations",
        status: "new",
        readTime: "—",
        tags: ["Template", "Scheduling"],
      },
      {
        id: "res-5",
        title: "Brand Asset Pack (Logos, Fonts, Photography)",
        description: "Full download of approved logos (PNG, SVG, EPS), brand fonts, and the licensed photography library. Use only these assets in all studio-facing materials.",
        date: "Jan 1, 2026",
        author: "HQ Creative",
        status: null,
        readTime: "—",
        tags: ["Brand", "Design"],
      },
      {
        id: "res-6",
        title: "New Member Intro Class Script",
        description: "Front-desk talking points and instructor cue sheet for the standard 50-minute intro class. Includes safety waiver reminder, equipment orientation, and post-class membership pitch timing.",
        date: "Mar 18, 2026",
        author: "HQ Training",
        status: null,
        readTime: "—",
        tags: ["Template", "Sales"],
      },
    ],
  },
];

function DocBadge({ status }: { status: DocStatus }) {
  if (!status) return null;
  const map = {
    pinned:  { label: "Pinned",   bg: "#FEF3C7", color: "#92400E" },
    new:     { label: "New",      bg: "#D1FAE5", color: "#065F46" },
    updated: { label: "Updated",  bg: "#DBEAFE", color: "#1E40AF" },
  };
  const s = map[status];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium"
      style={{ background: "#EEF3FB", color: "#4A638D" }}
    >
      {label}
    </span>
  );
}

export default function HubContent() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("announcements");
  const [search, setSearch] = useState("");

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId) ?? CATEGORIES[0];

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return activeCategory.docs;
    const q = search.toLowerCase();
    return activeCategory.docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }, [activeCategory, search]);

  return (
    <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-6 py-8 gap-7">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div
          className="sticky top-24 rounded-2xl overflow-hidden"
          style={{ border: "1px solid #C8D8EE", background: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.07)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
              Categories
            </p>
          </div>

          <nav className="px-3 py-3 flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategoryId;
              const newCount = cat.docs.filter((d) => d.status === "new").length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategoryId(cat.id); setSearch(""); }}
                  className={`text-left w-full px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-[#EEF3FB] text-[#4A638D] font-semibold"
                      : "text-[#6B7280] font-normal hover:bg-[#EEF3FB] hover:text-[#4A638D]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    {newCount > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#D1FAE5", color: "#065F46" }}
                      >
                        {newCount}
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: isActive ? "#4A638D" : "#C8D8EE" }}>
                      {cat.docs.length}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="px-5 py-4" style={{ borderTop: "1px solid #EEF3FB" }}>
            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Powered by JETSET HQ</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#C8D8EE" }}>Last updated Jun 20, 2026</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">

        {/* Category header + search */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: "#1F2937" }}>
                  {activeCategory.label}
                </h2>
              </div>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {activeCategory.description}
              </p>
            </div>
            <div className="relative flex-shrink-0 w-60">
              <input
                type="text"
                placeholder={`Search ${activeCategory.label.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A638D]/30"
                style={{ borderColor: "#C8D8EE", background: "#fff", color: "#1F2937" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>
                ⌕
              </span>
            </div>
          </div>
        </div>

        {/* Doc cards */}
        {filteredDocs.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#C8D8EE", background: "#fff" }}
          >
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              No documents match &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDocs.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl border px-6 py-5 transition-all hover:border-[#4A638D] hover:shadow-[0_4px_20px_rgba(74,99,141,0.10)] hover:-translate-y-0.5 cursor-pointer"
                style={{ borderColor: "#C8D8EE", background: "#fff" }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: "#1F2937" }}>
                      {doc.title}
                    </h3>
                    <DocBadge status={doc.status} />
                  </div>
                  {doc.readTime && doc.readTime !== "—" && (
                    <span className="text-[11px] flex-shrink-0" style={{ color: "#9CA3AF" }}>
                      {doc.readTime} read
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed mb-3" style={{ color: "#6B7280" }}>
                  {doc.description}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(doc.tags ?? []).map((tag) => (
                      <TagChip key={tag} label={tag} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{doc.author}</span>
                    <span className="text-[11px]" style={{ color: "#C8D8EE" }}>·</span>
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{doc.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
