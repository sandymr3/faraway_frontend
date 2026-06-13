"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSwarm } from "@/lib/store";

export default function AlertBanner() {
  const banner = useSwarm((s) => s.banner);
  const bannerKey = useSwarm((s) => s.bannerKey);
  const clearBanner = useSwarm((s) => s.clearBanner);

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(clearBanner, banner.level === "critical" ? 6000 : 3500);
    return () => clearTimeout(id);
  }, [banner, bannerKey, clearBanner]);

  const show = banner && banner.level !== "info";
  const color =
    banner?.level === "critical" ? "var(--red)" : "var(--amber)";

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        pointerEvents: "none",
        width: "min(640px, 80%)",
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            key={bannerKey}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              border: `1px solid ${color}`,
              background: "rgba(10, 4, 4, 0.85)",
              boxShadow: `0 0 30px ${banner!.level === "critical" ? "rgba(255,59,48,0.5)" : "rgba(255,176,0,0.4)"}`,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              className={banner!.level === "critical" ? "blink" : ""}
              style={{ color, fontSize: 22, lineHeight: 1 }}
            >
              ⚠
            </span>
            <div>
              <div
                className={`display ${banner!.level === "critical" ? "glow-red" : "glow-amber"}`}
                style={{ color, fontSize: 14, letterSpacing: "0.1em" }}
              >
                {banner!.msg}
              </div>
              {banner!.nodes && banner!.nodes.length > 0 && (
                <div className="mono" style={{ color: "var(--text-dim)", fontSize: 10, marginTop: 3 }}>
                  AFFECTED: {banner!.nodes.join(" · ")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
