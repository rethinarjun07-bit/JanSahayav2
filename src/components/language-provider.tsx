"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { DICTIONARY, PHRASE_MAP, Language, TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyOrText: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => { },
  t: (keyOrText) => {
    return (DICTIONARY.en as Record<string, string>)[keyOrText] || keyOrText;
  },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const originalTextMap = useRef<WeakMap<Node, string>>(new WeakMap());

  // Safe translation helper
  const t = useCallback(
    (keyOrText: TranslationKey | string): string => {
      if (!keyOrText) return "";

      const currentDict = DICTIONARY[language] as Record<string, string>;
      const enDict = DICTIONARY.en as Record<string, string>;

      // 1. Check exact dictionary key in active language
      if (currentDict && currentDict[keyOrText]) {
        return currentDict[keyOrText];
      }

      // 2. Check phrase lookup map (translates English string directly to Hindi/Urdu)
      if (language !== "en" && PHRASE_MAP[language]) {
        const trimmed = keyOrText.trim();
        if (PHRASE_MAP[language][trimmed]) {
          return PHRASE_MAP[language][trimmed];
        }
      }

      // 3. Fallback to English dictionary key if key exists
      if (enDict && enDict[keyOrText]) {
        return enDict[keyOrText];
      }

      return keyOrText;
    },
    [language]
  );

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("jansahaya_lang") as Language;

    if (saved && (saved === "en" || saved === "hi" || saved === "ur")) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ur" ? "rtl" : "ltr";
    }
  }, []);

  // Update DOM attributes and subtle text replacements
  useEffect(() => {
    if (typeof window === "undefined") return;

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";

    if (language === "ur") {
      document.documentElement.classList.add("lang-urdu");
    } else {
      document.documentElement.classList.remove("lang-urdu");
    }

    if (language === "en") {
      // Restore any translated DOM nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node = walker.nextNode();
      while (node) {
        if (originalTextMap.current.has(node)) {
          node.nodeValue = originalTextMap.current.get(node)!;
        }
        node = walker.nextNode();
      }
      return;
    }

    const currentMap = PHRASE_MAP[language];
    if (!currentMap) return;

    const translateNodes = () => {
      try {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName.toLowerCase();
              if (
                tag === "script" ||
                tag === "style" ||
                tag === "code" ||
                tag === "pre" ||
                tag === "input" ||
                tag === "textarea" ||
                parent.isContentEditable
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          }
        );

        let node = walker.nextNode();
        while (node) {
          const currentVal = node.nodeValue?.trim();
          if (currentVal && currentMap[currentVal]) {
            if (!originalTextMap.current.has(node)) {
              originalTextMap.current.set(node, node.nodeValue!);
            }
            node.nodeValue = currentMap[currentVal];
          }
          node = walker.nextNode();
        }
      } catch {
        // Safe tree-walker fallback
      }
    };

    translateNodes();
    const timer = setTimeout(translateNodes, 300);
    return () => clearTimeout(timer);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("jansahaya_lang", lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
