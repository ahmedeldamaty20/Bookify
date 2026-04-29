'use client';

import Image from 'next/image';
import Link from 'next/link';

const HeroSection = () => {
  const steps = [
    { number: 1, title: 'Upload PDF', description: 'Add your book file' },
    { number: 2, title: 'AI Processing', description: 'We analyze the content' },
    { number: 3, title: 'Voice Chat', description: 'Discuss with AI' },
  ];

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left Section */}
        <div className="hero-left">
          <h1 className="hero-title">Your Library</h1>
          <p className="hero-description">
            Convert your books into interactive AI conversations. Listen, learn, and discuss your favorite reads.
          </p>
          <button className="hero-button">
            <Link href="/books/new">
              <span className="pr-1">+</span> <span>Add new book</span>
            </Link>
          </button>
        </div>

        {/* Center Section - Illustration */}
        <div className="hero-center">
          <Image
            src="/assets/hero-illustration.png"
            alt="Vintage books and globe"
            width={400}
            height={500}
            className="hero-illustration"
            priority
          />
        </div>

        {/* Right Section - Steps Card */}
        <div className="hero-right">
          <div className="steps-card">
            {steps.map((step) => (
              <div key={step.number} className="step-item">
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
