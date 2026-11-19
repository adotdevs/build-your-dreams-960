import { useState, useMemo } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, de, es, it, pt, ar, enUS, type Locale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Shield, Zap, TrendingUp, Loader2, CalendarIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian", "Austrian",
  "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
  "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian",
  "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", "Congolese",
  "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian",
  "Egyptian", "Emirati", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French",
  "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese",
  "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
  "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz", "Laotian",
  "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malawian", "Malaysian",
  "Maldivian", "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Monacan", "Mongolian", "Montenegrin",
  "Moroccan", "Mozambican", "Namibian", "Nepalese", "New Zealand", "Nicaraguan", "Nigerian", "North Korean", "Norwegian", "Omani",
  "Pakistani", "Panamanian", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan",
  "Saudi", "Senegalese", "Serbian", "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean", "Spanish",
  "Sri Lankan", "Sudanese", "Surinamese", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai",
  "Togolese", "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan",
  "Vietnamese", "Yemeni", "Zambian", "Zimbabwean"
];

const Register = () => {
  const { t, i18n } = useTranslation('auth');

  const dateLocaleMap: Record<string, Locale> = useMemo(() => ({
    fr, de, es, it, pt, ar, en: enUS
  }), []);

  const currentDateLocale = dateLocaleMap[i18n.language] || enUS;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: undefined as Date | undefined,
    nationality: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('login.error'),
        description: t('register.errors.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 1) {
      toast({
        title: t('login.error'),
        description: t('register.errors.passwordLength'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : null,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('already registered')) {
          errorMessage = t('register.errors.alreadyRegistered');
        }

        toast({
          title: t('login.error'),
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('register.success.title'),
        description: t('register.success.description'),
      });
      navigate("/fiscal-profile");
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: Shield, text: t('register.leftPanel.benefit1') },
    { icon: Zap, text: t('register.leftPanel.benefit2') },
    { icon: TrendingUp, text: t('register.leftPanel.benefit3') },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-40 right-20 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <Logo size="lg" className="brightness-0 invert" />
          
          {/* Main Message */}
          <div className="space-y-8">
            <div>
              <h1 className="mb-4 text-4xl font-bold leading-tight xl:text-5xl">
                {t('register.leftPanel.title')}
              </h1>
              <p className="text-lg text-white/80">
                {t('register.leftPanel.subtitle')}
              </p>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <span className="text-lg">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Trust Badge */}
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white/30 bg-gradient-to-br from-white/40 to-white/20" />
              ))}
            </div>
            <div>
              <p className="font-semibold">{t('register.leftPanel.users')}</p>
              <p className="text-sm text-white/70">{t('register.leftPanel.usersSubtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col lg:w-1/2 xl:w-[55%]">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <Logo size="md" />
          <Link to="/login" className="text-sm font-medium text-primary">
            {t('register.signIn')}
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-start sm:items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {t('register.title')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t('register.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('register.firstName')}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder={t('register.placeholders.firstName')}
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('register.lastName')}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder={t('register.placeholders.lastName')}
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('register.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('register.placeholders.email')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('register.phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t('register.placeholders.phone')}
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('register.dateOfBirth')}</Label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start text-left font-normal",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? format(formData.dateOfBirth, "dd MMMM yyyy", { locale: currentDateLocale }) : t('register.select')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth}
                        onSelect={(date) => {
                          setFormData({ ...formData, dateOfBirth: date });
                          if (date) setDatePopoverOpen(false);
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        captionLayout="dropdown"
                        startMonth={new Date(1920, 0)}
                        endMonth={new Date(new Date().getFullYear() - 18, 11)}
                        defaultMonth={formData.dateOfBirth ?? new Date(1990, 0)}
                        locale={currentDateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t('register.nationality')}</Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('register.select')} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      {NATIONALITIES.map((nat) => (
                        <SelectItem key={nat} value={nat}>
                          {nat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('register.address')}</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder={t('register.placeholders.address')}
                  value={formData.address}
                  onChange={handleChange}
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('register.city')}</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder={t('register.placeholders.city')}
                    value={formData.city}
                    onChange={handleChange}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('register.postalCode')}</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder={t('register.placeholders.postalCode')}
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('register.country')}</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder={t('register.placeholders.country')}
                    value={formData.country}
                    onChange={handleChange}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('register.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('register.placeholders.password')}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-11 pr-11"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('register.passwordHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('register.placeholders.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              {/* Terms */}
              <p className="text-xs text-muted-foreground">
                {t('register.termsAgree')}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t('register.termsOfService')}</Link>
                {" "}{t('register.and')}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t('register.privacyPolicy')}</Link>.
              </p>

              <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('register.loading')}
                  </>
                ) : (
                  t('register.submit')
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">{t('register.or')}</span>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-medium">{t('register.dataProtected')}</p>
                <p className="text-muted-foreground">{t('register.sslEncryption')}</p>
              </div>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground">
              {t('register.hasAccount')}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t('register.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
