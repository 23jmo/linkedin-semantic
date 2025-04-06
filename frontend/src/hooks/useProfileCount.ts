import { useState, useEffect, useRef } from "react";

export function useProfileCount() {
  const [count, setCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/profile-count");
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setCount(data.count || 0);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch count");
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  // Animate the count
  useEffect(() => {
    if (count === 0) return;

    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    const duration = 2000; // 2 seconds
    const steps = Math.min(count, 60); // Use count itself as steps for small numbers
    const stepDuration = duration / steps;
    const increment = count / steps;
    let currentStep = 0;

    animationRef.current = setInterval(() => {
      currentStep++;

      if (currentStep >= steps) {
        setDisplayCount(count);
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
        return;
      }

      setDisplayCount(Math.round(currentStep * increment));
    }, stepDuration);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [count]); // Only depend on count, not displayCount

  return { count: displayCount, isLoading, error };
}
