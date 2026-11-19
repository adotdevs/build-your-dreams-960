import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Upload, CheckCircle2, Loader2, Shield, Search, Wallet, ArrowRight, Lock, Database, Camera, User, KeyRound } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type KYCStep = "upload" | "verification" | "complete";

const VERIFICATION_DURATION = 135; // 2 minutes 15 seconds

const databases = [
  { name: "France - AMF Database", flag: "🇫🇷" },
  { name: "Germany - BaFin Registry", flag: "🇩🇪" },
  { name: "Belgium - FSMA Records", flag: "🇧🇪" },
  { name: "United Kingdom - FCA Database", flag: "🇬🇧" },
  { name: "Netherlands - AFM Registry", flag: "🇳🇱" },
  { name: "Switzerland - FINMA Records", flag: "🇨🇭" },
  { name: "Luxembourg - CSSF Database", flag: "🇱🇺" },
  { name: "Spain - CNMV Registry", flag: "🇪🇸" },
  { name: "Italy - CONSOB Database", flag: "🇮🇹" },
  { name: "Austria - FMA Records", flag: "🇦🇹" },
  { name: "European Union - ESMA Central", flag: "🇪🇺" },
  { name: "Interpol - Financial Crimes", flag: "🌐" },
  { name: "International Recovery Fund", flag: "🌐" },
];

type StepTone = "active" | "done" | "idle";

function KycStepRail({
  steps,
}: {
  steps: { icon: ReactNode; label: string; tone: StepTone; connector?: "done" | "idle" }[];
}) {
  return (
    <div className="flex items-start justify-center">
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className="flex items-start">
          <div className="flex w-[4.75rem] flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                step.tone === "active" && "bg-primary text-primary-foreground shadow-md",
                step.tone === "done" && "bg-success text-success-foreground shadow-md",
                step.tone === "idle" && "bg-muted text-muted-foreground",
              )}
            >
              {step.icon}
            </div>
            <span
              className={cn(
                "text-center text-xs leading-tight",
                step.tone === "done" && "font-medium text-success",
                step.tone === "active" && "font-medium text-foreground",
                step.tone === "idle" && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn("mt-[22px] h-0.5 w-8 shrink-0", step.connector === "done" ? "bg-success" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}

const KYC = () => {
  const { t } = useTranslation('auth');
  const [step, setStep] = useState<KYCStep>("upload");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cryptoIdCode, setCryptoIdCode] = useState("");
  const [cryptoIdError, setCryptoIdError] = useState("");
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [currentDatabase, setCurrentDatabase] = useState(0);
  const [completedDatabases, setCompletedDatabases] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fcaMatchFound, setFcaMatchFound] = useState(false);
  const [fcaMatchVisible, setFcaMatchVisible] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getProgress = () => {
    switch (step) {
      case "upload": return 33;
      case "verification": return 66;
      case "complete": return 100;
    }
  };

  const ALLOWED_ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const ALLOWED_SELFIE_TYPES = ['image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleIdentityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_ID_TYPES.includes(file.type)) {
      toast({
        title: t('kyc.toast.invalidFormat'),
        description: t('kyc.toast.allowedFormats'),
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('kyc.toast.fileTooLarge'),
        description: t('kyc.toast.maxFileSize'),
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    setIdentityFile(file);
    toast({
      title: t('kyc.toast.documentUploaded'),
      description: file.name,
    });
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_SELFIE_TYPES.includes(file.type)) {
      toast({
        title: t('kyc.toast.invalidFormat'),
        description: t('kyc.toast.allowedSelfieFormats'),
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('kyc.toast.fileTooLarge'),
        description: t('kyc.toast.maxFileSize'),
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    setSelfieFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast({
      title: t('kyc.toast.photoUploaded'),
      description: t('kyc.toast.photoCaptured'),
    });
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: t('kyc.toast.cameraDenied'),
        description: t('kyc.toast.cameraDeniedDesc'),
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            setSelfieFile(file);
            setSelfiePreview(canvas.toDataURL("image/jpeg"));
            closeCamera();
            toast({
              title: t('kyc.toast.selfieCapture'),
              description: t('kyc.toast.selfieCaptureDesc'),
            });
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Attach stream to video element once it's rendered
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const uploadDocuments = async () => {
    if (!identityFile || !selfieFile) return false;

    if (!user) {
      console.log("No user logged in, skipping upload to storage");
      return true;
    }

    setIsUploading(true);
    try {
      const identityExt = identityFile.name.split('.').pop();
      const identityPath = `${user.id}/identity.${identityExt}`;
      console.log("Uploading identity document:", identityPath);
      const { error: identityError } = await supabase.storage
        .from('kyc-documents')
        .upload(identityPath, identityFile, { upsert: true });

      if (identityError) {
        console.error("Identity upload error:", identityError);
        throw identityError;
      }

      const selfieExt = selfieFile.name.split('.').pop() || 'jpg';
      const selfiePath = `${user.id}/selfie.${selfieExt}`;
      console.log("Uploading selfie:", selfiePath);
      const { error: selfieError } = await supabase.storage
        .from('kyc-documents')
        .upload(selfiePath, selfieFile, { upsert: true });

      if (selfieError) {
        console.error("Selfie upload error:", selfieError);
        throw selfieError;
      }

      console.log("Updating profile with KYC paths");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_document_front_url: identityPath,
          kyc_selfie_url: selfiePath,
          kyc_status: 'pending'
        })
        .eq('id', user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      return true;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('kyc.toast.uploadFailed'),
        description: error?.message || t('kyc.toast.tryAgain'),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!identityFile || !selfieFile) return;

    try {
      // Validate crypto ID code
      setCryptoIdError("");
      if (!cryptoIdCode.trim()) {
        setCryptoIdError(t('kyc.cryptoIdRequired'));
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .rpc('validate_company_crypto_code', { p_crypto_id_code: cryptoIdCode.trim() })
        .maybeSingle();

      if (companyError || !companyData) {
        console.error("Company validation error:", companyError);
        setCryptoIdError(t('kyc.cryptoIdInvalid'));
        return;
      }

      // Update profile with company_id
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ company_id: (companyData as any).id })
          .eq('id', user.id);
        
        if (updateError) {
          console.error("Profile company update error:", updateError);
        }
      }

      const uploaded = await uploadDocuments();
      if (uploaded) {
        setStep("verification");
        setVerificationProgress(0);
        setCurrentDatabase(0);
        setCompletedDatabases([]);
        setFcaMatchFound(false);
        setFcaMatchVisible(false);
      }
    } catch (error: any) {
      console.error("handleSubmit error:", error);
      toast({
        title: t('kyc.toast.uploadFailed'),
        description: error?.message || t('kyc.toast.tryAgain'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (step !== "verification") return;

    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / VERIFICATION_DURATION);
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [step]);

  useEffect(() => {
    if (step !== "verification") return;

    const dbInterval = setInterval(() => {
      setCurrentDatabase(prev => {
        const next = prev + 1;
        if (next >= databases.length) {
          clearInterval(dbInterval);
          setTimeout(() => setStep("complete"), 2000);
          return prev;
        }
        setCompletedDatabases(completed => [...completed, prev]);
        // FCA is index 3 - trigger match notification when it completes
        if (prev === 3) {
          setFcaMatchFound(true);
          setTimeout(() => setFcaMatchVisible(true), 300);
        }
        return next;
      });
    }, (VERIFICATION_DURATION * 1000) / databases.length);

    return () => clearInterval(dbInterval);
  }, [step]);

  const handleComplete = async () => {
    // Make sure the session is still valid before entering the wallet,
    // otherwise the dashboard bounces the client back to the start.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({
        title: t('kyc.toast.sessionExpired', 'Session expired'),
        description: t('kyc.toast.sessionExpiredDesc', 'Please sign in again to access your wallet.'),
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    navigate("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const remaining = Math.max(0, VERIFICATION_DURATION - Math.floor((verificationProgress / 100) * VERIFICATION_DURATION));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 notranslate" translate="no">
      <SimpleHeader />

      {/* Progress */}
      <div className="border-b bg-background">
        <div className="container py-3">
          <Progress value={getProgress()} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-lg">
          
          {/* UPLOAD STEP */}
          {step === "upload" && (
            <div className="space-y-6">
              <KycStepRail
                steps={[
                  { icon: <Upload className="h-6 w-6" />, label: t("kyc.steps.upload"), tone: "active", connector: "idle" },
                  { icon: <Search className="h-6 w-6" />, label: t("kyc.steps.check"), tone: "idle", connector: "idle" },
                  { icon: <Wallet className="h-6 w-6" />, label: t("kyc.steps.access"), tone: "idle" },
                ]}
              />

              {/* Title */}
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-bold">{t('kyc.title')}</h1>
                <p className="text-muted-foreground">
                  {t('kyc.subtitle')}
                </p>
              </div>

              {/* Explanation Card */}
              <div className="rounded-xl border bg-card p-5">
                <p className="mb-4 font-medium">{t('kyc.whyNeeded')}</p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
                    <p dangerouslySetInnerHTML={{ __html: t('kyc.reason1') }} />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
                    <p dangerouslySetInnerHTML={{ __html: t('kyc.reason2') }} />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
                    <p dangerouslySetInnerHTML={{ __html: t('kyc.reason3') }} />
                  </div>
                </div>
              </div>

              {/* Upload Areas */}
              <div className="space-y-4">
                {/* ID Upload */}
                <div className="rounded-xl border-2 border-dashed bg-card p-5 transition-all hover:border-primary/50">
                  <input
                    type="file"
                    id="identity-upload"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleIdentityUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="identity-upload"
                    className="flex cursor-pointer items-center gap-4"
                  >
                    {identityFile ? (
                      <>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success/10">
                          <CheckCircle2 className="h-7 w-7 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t('kyc.idDocument')}</p>
                          <p className="text-sm text-success">{identityFile.name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Upload className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t('kyc.uploadYourId')}</p>
                          <p className="text-sm text-muted-foreground">{t('kyc.idFormats')}</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Selfie Upload */}
                <div className="rounded-xl border-2 border-dashed bg-card p-5 transition-all hover:border-primary/50">
                  <input
                    type="file"
                    id="selfie-upload"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleSelfieUpload}
                    className="hidden"
                  />
                  
                  {isCameraOpen ? (
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-lg">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="mr-2 h-4 w-4" />
                          {t('kyc.takePhoto')}
                        </Button>
                        <Button variant="outline" onClick={closeCamera}>
                          {t('kyc.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : selfiePreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                        <img 
                          src={selfiePreview} 
                          alt="Selfie preview" 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-success/20">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t('kyc.photoVerified')}</p>
                        <p className="text-sm text-success">{t('kyc.selfieCaptured')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={openCamera}
                          className="text-xs"
                        >
                          {t('kyc.retake')}
                        </Button>
                        <label 
                          htmlFor="selfie-upload"
                          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          {t('kyc.upload')}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <label 
                        htmlFor="selfie-upload"
                        className="flex cursor-pointer items-center gap-4"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t('kyc.takeSelfie')}</p>
                          <p className="text-sm text-muted-foreground">{t('kyc.selfieHint')}</p>
                        </div>
                      </label>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            openCamera();
                          }}
                          className="text-xs"
                        >
                          <Camera className="mr-1.5 h-3.5 w-3.5" />
                          {t('kyc.useCamera')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Crypto ID Code */}
              <div className="space-y-2">
                <Label htmlFor="cryptoIdCode" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  {t('kyc.cryptoIdLabel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cryptoIdCode"
                  placeholder="Ex: CG-2024-ALPHA"
                  value={cryptoIdCode}
                  onChange={(e) => { setCryptoIdCode(e.target.value); setCryptoIdError(""); }}
                  className={cn("h-11 font-mono tracking-wider uppercase", cryptoIdError && "border-destructive")}
                />
                {cryptoIdError && (
                  <p className="text-xs text-destructive">{cryptoIdError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('kyc.cryptoIdHint')}
                </p>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-success" />
                <span>{t('kyc.dataEncrypted')}</span>
              </div>

              {/* CTA */}
              <Button 
                onClick={handleSubmit} 
                disabled={!identityFile || !selfieFile || !cryptoIdCode.trim() || isUploading}
                size="lg" 
                className="h-12 w-full font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('kyc.uploadingDocs')}
                  </>
                ) : (
                  <>
                    {t('kyc.verifyIdentity')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* VERIFICATION STEP */}
          {step === "verification" && (
            <div className="space-y-6">
              <KycStepRail
                steps={[
                  { icon: <CheckCircle2 className="h-6 w-6" />, label: t("kyc.steps.done"), tone: "done", connector: "done" },
                  { icon: <Loader2 className="h-6 w-6 animate-spin" />, label: t("kyc.steps.checking"), tone: "active", connector: "idle" },
                  { icon: <Wallet className="h-6 w-6" />, label: t("kyc.steps.access"), tone: "idle" },
                ]}
              />

              {/* Main Loading */}
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Database className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <h1 className="mb-2 text-xl font-bold">{t('kyc.searchingDatabases')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('kyc.checkingRecords')}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('kyc.progress')}</span>
                  <span className="font-medium">{Math.round(verificationProgress)}%</span>
                </div>
                <Progress value={verificationProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('kyc.databasesChecked', { completed: completedDatabases.length, total: databases.length })}</span>
                  <span>{t('kyc.remaining', { time: formatTime(verificationProgress) })}</span>
                </div>
              </div>

              {/* Current Database */}
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('kyc.currentlyChecking')}</p>
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-2xl">{databases[currentDatabase]?.flag}</span>
                  <span className="font-medium">{databases[currentDatabase]?.name}</span>
                </div>
              </div>

              {/* Completed Databases */}
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('kyc.completedChecks')}</p>
                {completedDatabases.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">{t('kyc.startingVerification')}</p>
                ) : (
                  completedDatabases.map((dbIndex) => (
                    <div key={dbIndex} className={cn(
                      "flex items-center gap-2 rounded-lg p-2 text-sm",
                      dbIndex === 3 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-background"
                    )}>
                      <CheckCircle2 className={cn("h-4 w-4", dbIndex === 3 ? "text-emerald-500" : "text-success")} />
                      <span>{databases[dbIndex].flag}</span>
                      <span className={cn(dbIndex === 3 ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>{databases[dbIndex].name}</span>
                      {dbIndex === 3 && (
                        <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t('kyc.matchDetected')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* FCA Match Notification */}
              {fcaMatchFound && (
                <div 
                  className={cn(
                    "rounded-xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all duration-700 ease-out",
                    fcaMatchVisible 
                      ? "opacity-100 translate-y-0 scale-100" 
                      : "opacity-0 translate-y-4 scale-95"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 animate-pulse">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇬🇧</span>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {t('kyc.fcaMatchTitle')}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('kyc.fcaMatchDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                <Lock className="h-4 w-4 shrink-0" />
                <span>{t('kyc.doNotClose')}</span>
              </div>
            </div>
          )}

          {/* COMPLETE STEP */}
          {step === "complete" && (
            <div className="space-y-6">
              <KycStepRail
                steps={[
                  { icon: <CheckCircle2 className="h-6 w-6" />, label: t("kyc.steps.done"), tone: "done", connector: "done" },
                  { icon: <CheckCircle2 className="h-6 w-6" />, label: t("kyc.steps.done"), tone: "done", connector: "done" },
                  { icon: <Wallet className="h-6 w-6" />, label: t("kyc.steps.ready"), tone: "done" },
                ]}
              />

              {/* Success */}
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h1 className="mb-2 text-xl font-bold">{t('kyc.verificationComplete')}</h1>
                <p className="text-muted-foreground">
                  {t('kyc.fundsFound')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 items-stretch gap-3">
                <div className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-xl border bg-card px-3 py-4 text-center">
                  <p className="text-2xl font-bold leading-none text-primary">{databases.length}</p>
                  <p className="mt-2 text-xs leading-tight text-muted-foreground">{t('kyc.databasesCheckedStat')}</p>
                </div>
                <div className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-xl border bg-card px-3 py-4 text-center">
                  <p className="text-2xl font-bold leading-none text-success">1</p>
                  <p className="mt-2 text-xs leading-tight text-muted-foreground">{t('kyc.matchFound')}</p>
                </div>
              </div>

              {/* Result Card */}
              <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-transparent p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                    <Wallet className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="min-w-0 text-start">
                    <p className="font-semibold">{t('kyc.recoveredFunds')}</p>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('kyc.recoveredFundsDesc') }} />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button onClick={handleComplete} size="lg" className="h-12 w-full font-semibold">
                {t('kyc.accessDashboard')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default KYC;
