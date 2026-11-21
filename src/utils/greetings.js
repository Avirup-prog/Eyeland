// Greetings utility for Eyeland
// Provides time-of-day contextual greetings, user profile name formatting,
// and ensures messages do not repeat back-to-back.

export function formatUserName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Friend';
  const clean = rawName.trim();
  // Filter out system or generic placeholders
  if (!clean || clean.toLowerCase() === 'user' || clean.toLowerCase() === 'admin') {
    return 'Friend';
  }
  // Convert "ASUS ROG" -> "Asus Rog", "john_doe" -> "John Doe"
  const parts = clean.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return 'Friend';
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

// Contextual greeting pools by time of day
const GREETING_POOLS = {
  morning: [
    {
      headline: "Good morning, {name}!",
      subtext: "What are we up to today?",
      shortcut: "Let's build",
    },
    {
      headline: "Rise and shine, {name}!",
      subtext: "Ready to conquer today's goals?",
      shortcut: "Start fresh",
    },
    {
      headline: "Morning, {name}!",
      subtext: "Grab your coffee—big things ahead today.",
      shortcut: "Open focus",
    },
    {
      headline: "Fresh day, fresh start, {name}!",
      subtext: "What's on our agenda for today?",
      shortcut: "Check tasks",
    },
    {
      headline: "Good morning, {name}!",
      subtext: "Eyeland is powered up and ready for you.",
      shortcut: "What's new",
    },
  ],
  afternoon: [
    {
      headline: "Good afternoon, {name}!",
      subtext: "What are we diving into next?",
      shortcut: "Continue",
    },
    {
      headline: "Afternoon, {name}!",
      subtext: "Keeping the momentum rolling strong.",
      shortcut: "Flow state",
    },
    {
      headline: "Hey there, {name}!",
      subtext: "Halfway through the day—let's crush the rest.",
      shortcut: "Focus now",
    },
    {
      headline: "Good afternoon, {name}!",
      subtext: "Need a quick summary or scan? I'm ready.",
      shortcut: "Scan screen",
    },
    {
      headline: "Afternoon flow, {name}!",
      subtext: "What can I take off your plate today?",
      shortcut: "Ask AI",
    },
  ],
  evening: [
    {
      headline: "Good evening, {name}!",
      subtext: "Wrapping things up or just getting into the groove?",
      shortcut: "Wrap up",
    },
    {
      headline: "Evening, {name}!",
      subtext: "Let's close out today on a high note.",
      shortcut: "Review day",
    },
    {
      headline: "Hey {name}!",
      subtext: "Great work today. What's the final push?",
      shortcut: "Finish strong",
    },
    {
      headline: "Good evening, {name}!",
      subtext: "Wind-down mode or late-night creativity?",
      shortcut: "Night mode",
    },
    {
      headline: "Evening focus, {name}!",
      subtext: "I'm right here if you need a quick second pair of eyes.",
      shortcut: "Assist me",
    },
  ],
  night: [
    {
      headline: "Burning the midnight oil, {name}?",
      subtext: "Nocturnal creativity mode is unlocked.",
      shortcut: "Night focus",
    },
    {
      headline: "Late night session, {name}!",
      subtext: "Quiet hours, deep focus. What are we crafting?",
      shortcut: "Deep work",
    },
    {
      headline: "Hey night owl, {name}!",
      subtext: "Remember to get some rest, but I've got your back.",
      shortcut: "Stay chill",
    },
    {
      headline: "Late night flow, {name}!",
      subtext: "The world is quiet—let's make some magic.",
      shortcut: "Code away",
    },
  ],
};

export function getTimeSlot(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function getRandomGreeting(userName = 'Friend') {
  const slot = getTimeSlot();
  const pool = GREETING_POOLS[slot] || GREETING_POOLS.morning;
  
  // Retrieve last index from localStorage to avoid back-to-back repetitions
  const storageKey = `eyeland_last_greeting_${slot}`;
  let lastIndex = -1;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) lastIndex = parseInt(saved, 10);
  } catch {
    // ignore
  }

  // Pick an index different from lastIndex
  let availableIndices = pool.map((_, i) => i).filter(i => i !== lastIndex);
  if (availableIndices.length === 0) availableIndices = pool.map((_, i) => i);
  
  const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  try {
    localStorage.setItem(storageKey, chosenIndex.toString());
  } catch {
    // ignore
  }

  const template = pool[chosenIndex];
  const formattedName = formatUserName(userName);

  return {
    timeSlot: slot,
    headline: template.headline.replace('{name}', formattedName),
    subtext: template.subtext.replace('{name}', formattedName),
    shortcut: template.shortcut,
    userName: formattedName,
  };
}
