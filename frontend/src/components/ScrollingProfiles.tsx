"use client";

import { useEffect, useRef, useState } from "react";
import ScrollingProfileCard from "./ScrollingProfileCard";
import SkeletonProfileCard from "./SkeletonProfileCard";
import type { Profile } from "@/types/types";

export default function ScrollingProfiles({
  className,
}: {
  className: string;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadedProfiles, setLoadedProfiles] = useState<Set<string>>(new Set());
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch("/api/random-profiles");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Load profiles one by one with slight delays
        data.forEach((profile: Profile, index: number) => {
          setTimeout(() => {
            setLoadedProfiles((prev) => new Set([...prev, profile.id]));
          }, index * 200); // 200ms delay between each profile
        });

        setProfiles(data);
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const rows = [row1Ref, row2Ref, row3Ref];
    const speeds = [0.05, 0.04, 0.05];
    const directions = [1, -1, 1];
    const positions = [-800, -400, -1200];
    let animationFrameId: number;

    const animate = () => {
      rows.forEach((rowRef, i) => {
        if (!rowRef.current) return;
        positions[i] += speeds[i] * directions[i];

        const cardWidth = 800;
        const gap = 48;
        const totalCardWidth = cardWidth + gap;
        const singleSetWidth = totalCardWidth * 6; // Always use 6 cards

        if (directions[i] > 0) {
          if (positions[i] >= 0) positions[i] = -singleSetWidth;
        } else {
          if (positions[i] <= -singleSetWidth) positions[i] = 0;
        }

        rowRef.current.style.transform = `translateX(${positions[i]}px)`;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const repeatedProfiles = [...profiles, ...profiles];

  return (
    <div
      className={`w-full overflow-hidden py-12 ${className} z-10`}
      style={{ perspective: "1200px" }}
      data-oid="zekn7x3"
    >
      <div
        className="relative"
        style={{ transform: "rotateX(30deg)" }}
        data-oid="ibbwhm5"
      >
        <div className="space-y-8" data-oid="fy0l:zm">
          {[0, 1, 2].map((rowIndex) => (
            <div
              key={rowIndex}
              ref={
                rowIndex === 0 ? row1Ref : rowIndex === 1 ? row2Ref : row3Ref
              }
              className="flex gap-8"
              style={{
                willChange: "transform",
                transform: `translateZ(${-rowIndex * 500}px)`,
              }}
              data-oid="laq954d"
            >
              {repeatedProfiles.map((profile, i) =>
                loadedProfiles.has(profile.id) ? (
                  <ScrollingProfileCard
                    key={`${profile.id}-${i}`}
                    profile={profile}
                    row={2 - rowIndex}
                    data-oid="4rw_602"
                  />
                ) : (
                  <SkeletonProfileCard
                    key={`skeleton-${i}`}
                    data-oid="gry65r."
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
