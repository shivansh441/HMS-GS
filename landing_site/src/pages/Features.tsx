import React from 'react';
import Navbar from '../components/Navbar';
import Features from '../components/Features';
import Amenities from '../components/Amenities';
import { motion } from 'motion/react';
import { Sparkles, Shield, Zap, Coffee, Wifi, Wind, Tv, Users, Heart } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] transition-colors duration-500">
      <Navbar />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles size={14} />
              Premium Features
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-black mb-6 text-zinc-900 dark:text-white uppercase tracking-tighter">
              WORLD CLASS <span className="text-gradient">AMENITIES.</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              We provide everything you need for a comfortable and productive stay. Our properties are designed with the modern resident in mind.
            </p>
          </motion.div>

          <Features />
          
          <div className="mt-32">
            <Amenities />
          </div>

          <div className="mt-32 grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "24/7 Security", desc: "Biometric access and round-the-clock surveillance for total peace of mind." },
              { icon: Wifi, title: "High-Speed Internet", desc: "Dedicated fiber-optic connection in every room and common area." },
              { icon: Coffee, title: "Premium Mess", desc: "Nutritious and delicious meals prepared in a hygienic environment." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 bg-zinc-50 dark:bg-[#0F172A]/50 border-zinc-200 dark:border-white/10"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{item.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
