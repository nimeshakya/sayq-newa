"use client";

import { useState, useEffect, useCallback } from "react";
import { convertToRanjana } from "@/lib/ranjana-converter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, ArrowRight } from "lucide-react";

interface ConversionResult {
  input: string;
  output: string;
  inputType: "devanagari" | "roman";
}

export function RanjanaConverter() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<"nepali" | "roman">("nepali");

  const convertText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = convertToRanjana(text);
      setResult(data);
    } catch (error) {
      console.error("[v0] Conversion error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced live conversion
  useEffect(() => {
    const timer = setTimeout(() => {
      convertText(inputText);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText, convertText]);

  const handleCopy = async () => {
    if (result?.output) {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
  };

  const exampleTexts = {
    nepali: ["नेपाल", "नमस्ते", "काठमाडौं", "बुद्ध", "हिमालय"],
    roman: ["Nepal", "Namaste", "Kathmandu", "Buddha", "Himalaya"],
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Input Text</CardTitle>
              <Tabs
                value={inputMode}
                onValueChange={(v) => setInputMode(v as "nepali" | "roman")}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="nepali" className="text-xs px-3">
                    Nepali
                  </TabsTrigger>
                  <TabsTrigger value="roman" className="text-xs px-3">
                    Roman
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                inputMode === "nepali"
                  ? "टाइप गर्नुहोस् (e.g., नेपाल)"
                  : "Type here (e.g., Nepal)"
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[180px] text-lg resize-none bg-background/50"
            />

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {exampleTexts[inputMode].slice(0, 3).map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>

            {result && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {result.inputType === "devanagari"
                    ? "Devanagari"
                    : "Romanized"}
                </Badge>
                <span>detected</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                Ranjana Script
              </CardTitle>
              {result?.output && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`min-h-[180px] rounded-lg border border-border/50 bg-background/50 p-4 flex items-center justify-center transition-all ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              {result?.output ? (
                <p className="font-ranjana text-4xl md:text-5xl text-center leading-relaxed tracking-wide">
                  {result.output}
                </p>
              ) : (
                <p className="text-muted-foreground text-center">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Converting...
                    </span>
                  ) : (
                    "Your Ranjana script will appear here"
                  )}
                </p>
              )}
            </div>

            {result?.output && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground mb-1">Unicode Output:</p>
                <code className="text-xs font-mono break-all text-foreground">
                  {result.output}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Arrow for Mobile */}
      <div className="flex items-center justify-center py-4 lg:hidden">
        <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
      </div>
    </div>
  );
}
