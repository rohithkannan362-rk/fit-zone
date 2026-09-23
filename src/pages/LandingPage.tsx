import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  MessageCircle,
  Users,
  Dumbbell,
  Award,
  ArrowRight,
  Activity,
  Image as ImageIcon,
  ShieldCheck,
  Heart,
  ArrowDown,
  Check,
  Star,
  Quote,
  Loader2,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getActivePackages } from "../services/packageService";
import { type Package } from "../lib/supabase-types";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const LandingPage = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await getActivePackages();
        setPackages(pkgs);
      } catch (error) {
        console.error("Failed to load packages:", error);
      } finally {
        setLoadingPackages(false);
      }
    };
    loadPackages();
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-gym-red selection:text-white font-sans overflow-x-hidden">
      {/* 1. NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed w-full z-50 top-0 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 py-4 px-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-sm">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-widest uppercase">
          <a href="#" className="text-gym-red border-b-2 border-gym-red pb-1">
            Home
          </a>
          <a
            href="#about"
            className="text-white/60 hover:text-white transition-colors"
          >
            About
          </a>
          <a
            href="#founder"
            className="text-white/60 hover:text-white transition-colors"
          >
            Founder
          </a>
          <a
            href="#facilities"
            className="text-white/60 hover:text-white transition-colors"
          >
            Facilities
          </a>
          <a
            href="#plans"
            className="text-white/60 hover:text-white transition-colors"
          >
            Plans
          </a>
          <a
            href="#gallery"
            className="text-white/60 hover:text-white transition-colors"
          >
            Gallery
          </a>
          <a
            href="#contact"
            className="text-white/60 hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/admin/login"
            className="text-white/60 hover:text-white px-2 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300"
          >
            Admin Login
          </Link>
          <Link
            to="/member/login"
            className="border border-white/20 text-white/90 hover:bg-white hover:text-black px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300"
          >
            Member Login
          </Link>
          <Link
            to="/member/register"
            className="bg-gym-red hover:bg-red-600 text-white px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(255,51,51,0.3)] hover:shadow-[0_0_30px_rgba(255,51,51,0.5)] flex items-center gap-2"
          >
            Join Now <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>
      </motion.nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-16 px-8 min-h-screen flex flex-col justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent z-10"></div>
          <div className="absolute right-0 top-0 w-[80%] h-full z-0">
            <motion.img
              style={{ y: y1 }}
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"
              alt="Muscular back"
              className="w-full h-[120%] object-cover object-right-top grayscale opacity-50"
            />
          </div>
        </div>

        {/* Cursive Text */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: -5 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute right-32 top-48 z-20 hidden xl:block"
        >
          <p className="font-['Brush_Script_MT',cursive] text-6xl text-white/30">
            Same People
            <br />
            Stronger Stories
          </p>
        </motion.div>

        {/* Vertical Nav */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-6 text-[10px] font-bold font-mono text-white/30">
          <div className="text-gym-red">01</div>
          <div className="hover:text-white cursor-pointer transition-colors">
            02
          </div>
          <div className="hover:text-white cursor-pointer transition-colors">
            03
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-20 flex-1 flex flex-col justify-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-[10px] font-bold tracking-[0.4em] uppercase mb-6 flex flex-col gap-2"
            >
              <span>Discipline Today</span>
              <span>A Stronger Tomorrow</span>
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-6xl md:text-8xl lg:text-[100px] font-black uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl"
            >
              Invest In
              <br />
              <span className="text-gym-red inline-block mt-2">
                Your Strength
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-lg md:text-xl font-medium max-w-md mb-12 leading-relaxed"
            >
              More than a gym. A community that helps you build a stronger,
              healthier and better you.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                to="/register?plan=3m"
                className="bg-gym-red hover:bg-red-600 text-white px-10 py-5 text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,51,51,0.4)] hover:shadow-[0_0_50px_rgba(255,51,51,0.6)] flex items-center gap-2"
              >
                Join Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#plans"
                className="border border-white/20 hover:border-white hover:bg-white hover:text-black text-white px-10 py-5 text-sm font-bold uppercase tracking-widest transition-all duration-300"
              >
                View Plans
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-white/30"
          >
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span className="text-[8px] font-bold tracking-[0.2em] uppercase">
              Scroll Down
            </span>
          </motion.div>
        </div>
      </section>

      {/* 3. STATS BAR */}
      <section className="border-b border-white/5 bg-[#050505] relative z-20">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 group"
            >
              <Users className="w-10 h-10 text-gym-red group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-2xl font-black">500+</h3>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Happy Members
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 group"
            >
              <Dumbbell className="w-10 h-10 text-gym-red group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-2xl font-black">Premium</h3>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Equipment
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 group"
            >
              <Award className="w-10 h-10 text-gym-red group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-2xl font-black">Expert</h3>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Guidance
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 group"
            >
              <Activity className="w-10 h-10 text-gym-red group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-2xl font-black">Stronger</h3>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Community
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT BAR & TAGLINE */}
      <section className="border-b border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
          <div className="flex-1 px-8 py-8 flex flex-wrap items-center gap-12 border-r border-white/5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gym-red/10 flex items-center justify-center group-hover:bg-gym-red transition-colors">
                <MapPin className="w-5 h-5 text-gym-red group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider">
                  Kariyapatti
                </p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Tamil Nadu, 626106
                </p>
              </div>
            </div>

            <a
              href="tel:+917904458158"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gym-red/10 flex items-center justify-center group-hover:bg-gym-red transition-colors">
                <Phone className="w-5 h-5 text-gym-red group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider">
                  +91 79044 58158
                </p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Call Us
                </p>
              </div>
            </a>

            {/* Functional WhatsApp Link */}
            <a
              href="https://wa.me/917904458158"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider">
                  WhatsApp
                </p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Chat Now
                </p>
              </div>
            </a>
          </div>

          <div className="bg-gym-red/5 border-l-4 border-l-gym-red p-8 flex items-center justify-center lg:w-96 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gym-red opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <h3 className="text-2xl font-black uppercase tracking-widest text-center leading-tight">
              Train Harder
              <br />
              <span className="text-gym-red">Live Better</span>
            </h3>
          </div>
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section
        id="about"
        className="py-32 px-8 border-b border-white/5 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[250px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4"
            >
              About Fit Zone
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
            >
              More Than
              <br />
              <span className="text-gym-red">A Gym</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-base leading-relaxed mb-12"
            >
              FIT ZONE is Kariyapatti's premier fitness destination. We provide
              world-class equipment, expert guidance and a motivating
              environment to help you become the best version of yourself.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-8 mb-12 border-t border-white/10 pt-8"
            >
              <div>
                <h4 className="text-4xl font-black text-gym-red mb-1">
                  500<span className="text-2xl">+</span>
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Members
                </p>
              </div>
              <div>
                <h4 className="text-4xl font-black mb-1">
                  2<span className="text-2xl">+</span>
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Years
                </p>
              </div>
              <div>
                <h4 className="text-4xl font-black mb-1">
                  100<span className="text-2xl">%</span>
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Commitment
                </p>
              </div>
            </motion.div>

            <motion.button
              variants={fadeUp}
              className="bg-gym-red hover:bg-red-600 text-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Our Story <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px]"
          >
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
              alt="Gym Floor"
              className="w-full h-full object-cover grayscale brightness-75 rounded-sm"
            />

            {/* Floating Quote Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-8 -left-8 md:bottom-12 md:-left-12 bg-[#050505] p-8 border border-white/10 max-w-xs shadow-2xl"
            >
              <Quote className="w-8 h-8 text-gym-red mb-4" />
              <p className="text-xl font-bold italic leading-relaxed text-white/90">
                "A healthier tomorrow starts today."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5.5 FOUNDER SECTION */}
      <section
        id="founder"
        className="py-32 px-8 border-b border-white/5 relative overflow-hidden bg-[#030303]"
      >
        <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[250px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="relative h-[400px] md:h-[500px] flex-1">
              <img
                src="/founder1.jpeg"
                alt="Master M.Ravichandran"
                className="w-full h-full object-cover grayscale brightness-90 rounded-sm hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="relative h-[400px] md:h-[500px] flex-1 md:-mt-12">
              <img
                src="/founder2.png"
                alt="Master M.Ravichandran Fitness"
                className="w-full h-full object-cover grayscale brightness-90 rounded-sm hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4"
            >
              Meet The Founder
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
            >
              Master
              <br />
              <span className="text-gym-red">M.Ravichandran</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-base leading-relaxed mb-6"
            >
              With years of dedication to health and fitness, Master
              M.Ravichandran established FIT ZONE to bring a world-class
              training environment to Kariyapatti.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-base leading-relaxed mb-12"
            >
              His vision is simple: to create a community where discipline and
              hard work lead to a stronger, healthier tomorrow. Whether you are
              a beginner or a seasoned athlete, his expertise and guidance will
              help you push your limits.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t border-white/10 pt-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gym-red/10 rounded-full flex items-center justify-center border border-gym-red/30">
                  <Award className="w-8 h-8 text-gym-red" />
                </div>
                <div>
                  <h4 className="font-bold text-lg uppercase tracking-wider text-white">
                    Expert Trainer
                  </h4>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                    Certified Professional
                  </p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-white/10"></div>

              <a
                href="tel:+917904458158"
                className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gym-red/10 rounded-full flex items-center justify-center border border-gym-red/20 group-hover:bg-gym-red transition-colors">
                  <Phone className="w-5 h-5 text-gym-red group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-white">
                    +91 79044 58158
                  </h4>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                    Contact Master
                  </p>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. PLANS SECTION */}
      <section
        id="plans"
        className="py-32 px-8 border-b border-white/5 bg-[#050505]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                Membership Plans
              </p>
              <h2 className="text-5xl font-black uppercase tracking-tighter">
                Simple Plans. Bigger Results.
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase hidden md:block text-right"
            >
              Choose a plan.
              <br />
              Start your transformation.
            </motion.p>
          </div>

          {loadingPackages ? (
            <div className="flex justify-center py-20 w-full col-span-full">
              <Loader2 className="w-8 h-8 text-gym-red animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {packages.map((plan, idx) => (
                <motion.div
                  key={plan.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`relative p-8 rounded-sm transition-all duration-300 hover:-translate-y-2 flex flex-col group ${plan.popular ? "bg-[#0a0a0a] border border-gym-red shadow-[0_0_30px_rgba(255,51,51,0.15)]" : "bg-[#0a0a0a] border border-white/10 hover:border-white/30"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-4 bg-gym-red text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-sm shadow-[0_0_10px_rgba(255,51,51,0.5)]">
                      Popular
                    </div>
                  )}

                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center text-white/50">
                    {plan.name}
                  </h3>

                  <div className="flex items-start justify-center gap-1 mb-2">
                    <span className="text-xl font-bold mt-1">₹</span>
                    <span className="text-5xl font-black">
                      {plan.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-6 mb-8 text-center">
                    {plan.offer && (
                      <p className="text-xs font-bold tracking-widest text-gym-red">
                        {plan.offer}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-3 text-[11px] font-medium tracking-wide text-white/70"
                      >
                        <Check className="w-4 h-4 text-gym-red shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/member/register?plan=${plan.id}`}
                    className={`w-full py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                      plan.popular
                        ? "bg-gym-red text-white hover:bg-red-600"
                        : "border border-white/20 text-white hover:border-white"
                    }`}
                  >
                    Join Now <ArrowRight className="w-3 h-3" />
                  </Link>

                  <div
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${plan.popular ? "shadow-[0_0_50px_rgba(255,51,51,0.2)]" : ""}`}
                  ></div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. FACILITIES SECTION */}
      <section
        id="facilities"
        className="py-32 px-8 border-b border-white/5 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 grayscale">
          <img
            src="https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=2071&auto=format&fit=crop"
            alt="Bg"
            className="w-full h-full object-cover mask-image-gradient-l"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/3"
          >
            <p className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
              Facilities
            </p>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
              Everything
              <br />
              You Need
            </h2>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase leading-loose text-right">
              Premium Equipment.
              <br />
              Perfect Environment.
              <br />
              No Excuses.
            </p>
          </motion.div>

          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Dumbbell, label: "Strength\nTraining" },
              { icon: Activity, label: "Cardio\nZone" },
              { icon: ImageIcon, label: "Free\nWeights" },
              { icon: Award, label: "Modern\nEquipment" },
              { icon: Users, label: "Spacious\nWorkout Area" },
              { icon: ShieldCheck, label: "Clean\nLockers & Showers" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0a0a0a] border border-white/5 p-8 flex flex-col items-center justify-center text-center hover:bg-[#111] hover:border-gym-red/50 transition-all duration-300 group"
              >
                <f.icon className="w-10 h-10 text-white/50 mb-6 group-hover:text-gym-red group-hover:scale-110 transition-all duration-300 stroke-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors whitespace-pre-line leading-relaxed">
                  {f.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. GALLERY SECTION */}
      <section
        id="gallery"
        className="py-32 border-b border-white/5 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-8 mb-12 flex flex-col md:flex-row justify-between items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
              Gallery
            </p>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">
              Inside
              <br />
              Fit Zone
            </h2>
            <p className="text-white/50 text-sm">
              Real people. Real workouts.
              <br />
              Real results.
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 md:mt-0 border border-white/20 hover:border-white text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            View More Photos <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>

        <div className="flex overflow-x-auto gap-4 px-8 pb-8 snap-x hide-scrollbar">
          {[
            {
              src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
            },
            {
              src: "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=2070&auto=format&fit=crop",
            },
            {
              src: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=2071&auto=format&fit=crop",
            },
            { text: "NO EXCUSES\nJUST\nRESULTS" },
            {
              src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="min-w-[300px] md:min-w-[400px] h-[400px] shrink-0 snap-center relative group overflow-hidden"
            >
              {item.src ? (
                <>
                  <img
                    src={item.src}
                    alt="Gallery"
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 group-hover:brightness-100 transition-all duration-700"
                  />
                  <div className="absolute inset-0 border border-white/0 group-hover:border-gym-red/50 transition-colors duration-500"></div>
                </>
              ) : (
                <div className="w-full h-full bg-gym-red/10 border border-gym-red/20 flex items-center justify-center p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gym-red opacity-10"></div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-[0.9] text-gym-red whitespace-pre-line relative z-10 text-center drop-shadow-lg">
                    {item.text}
                  </h3>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. TESTIMONIALS (NEW) */}
      <section className="py-32 px-8 border-b border-white/5 relative overflow-hidden">
        {/* Background musclar art */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"
            alt="Back"
            className="w-full h-full object-cover mask-image-gradient-l grayscale"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
              What Our Members Say
            </p>
            <h2 className="text-5xl font-black uppercase tracking-tighter">
              Real People. Real Results.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:w-3/4">
            {[
              {
                name: "Arun Prakash",
                role: "Member",
                text: "Best gym in Kariyapatti! Clean, spacious and great trainers. Highly recommended!",
              },
              {
                name: "Vijay Kumar",
                role: "Member",
                text: "Amazing atmosphere and equipment. The trainers are very supportive. Totally worth it!",
              },
              {
                name: "Karthik Raja",
                role: "Member",
                text: "FIT ZONE has completely changed my lifestyle. More than a gym, it's a family.",
              },
            ].map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#080808] border border-white/5 p-8 hover:border-white/20 transition-colors"
              >
                <Quote className="w-6 h-6 text-gym-red mb-6" />
                <p className="text-white/70 text-sm leading-relaxed mb-8 h-24">
                  {review.text}
                </p>
                <div className="flex text-gym-red mb-6 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden">
                    <img
                      src={`https://i.pravatar.cc/150?img=${idx + 11}`}
                      alt="Avatar"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">
                      {review.name}
                    </h4>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">
                      {review.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="absolute right-0 bottom-20 hidden lg:block"
          >
            <p className="font-['Brush_Script_MT',cursive] text-6xl text-white/20 transform -rotate-12">
              Stronger People
              <br />
              Stronger Community
            </p>
          </motion.div>
        </div>
      </section>

      {/* 10. LOCATION SECTION */}
      <section
        id="contact"
        className="py-32 px-8 border-b border-white/5 bg-[#050505]"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-gym-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
              Our Location
            </p>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-8">
              Visit Us Today
            </h2>
            <div className="flex items-start gap-4 mb-12">
              <MapPin className="w-6 h-6 text-white shrink-0 mt-1" />
              <p className="text-white/70 text-sm leading-loose">
                1st Floor, Muthu Finance,
                <br />
                Jeevaa St, K Karaisal Kulam,
                <br />
                Kariyapatti, Tamil Nadu 626106
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button className="bg-gym-red hover:bg-red-600 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Get Directions
              </button>
              <a
                href="tel:+917904458158"
                className="border border-white/20 hover:border-white text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
              <a
                href="https://wa.me/917904458158"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 hover:border-[#25D366] hover:text-[#25D366] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[400px] flex items-center"
          >
            <div className="absolute inset-0 bg-[#080808] rounded-sm overflow-hidden border border-white/5">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                alt="Map Route"
                className="w-full h-full object-cover grayscale opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <MapPin className="w-10 h-10 text-gym-red mb-2 animate-bounce" />
                  <span className="text-gym-red font-bold text-xs tracking-widest uppercase">
                    Fit Zone Gym
                  </span>
                  <span className="text-white/50 text-[10px] tracking-wider uppercase mt-1">
                    Kariyapatti
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-16 bg-[#030303] py-8 pl-8 pr-16 border-l-2 border-gym-red z-10">
              <h3 className="text-xl font-bold uppercase tracking-[0.3em] leading-loose text-white/50">
                Fitness
                <br />
                Health
                <br />
                Discipline
                <br />
                <span className="text-white">A Better You</span>
              </h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-16 px-8 bg-[#030303]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="bg-white p-2 rounded-sm">
              <img
                src="/logo.jpg"
                alt="FIT ZONE"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">
              Stronger People. Stronger Community.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">
              <a href="#" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#founder" className="hover:text-white transition-colors">
                Founder
              </a>
              <a
                href="#facilities"
                className="hover:text-white transition-colors"
              >
                Facilities
              </a>
              <a href="#plans" className="hover:text-white transition-colors">
                Plans
              </a>
              <a href="#gallery" className="hover:text-white transition-colors">
                Gallery
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-white/20 text-[10px] tracking-widest uppercase">
                © 2026 FIT ZONE GYM. All rights reserved.
              </p>
              <div className="flex gap-4 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Member Login
                </Link>
                <span>|</span>
                <Link
                  to="/login?type=admin"
                  className="hover:text-white transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Heart className="w-4 h-4 text-white/50 hover:text-white cursor-pointer transition-colors" />
            <MessageCircle className="w-4 h-4 text-white/50 hover:text-white cursor-pointer transition-colors" />
            <MapPin className="w-4 h-4 text-white/50 hover:text-white cursor-pointer transition-colors" />
            <a
              href="#"
              className="ml-4 w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors text-white/50"
            >
              <ArrowRight className="w-4 h-4 transform -rotate-90" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
