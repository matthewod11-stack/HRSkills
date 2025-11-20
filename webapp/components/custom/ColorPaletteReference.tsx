'use client';

import { motion } from 'framer-motion';

/**
 * ColorPaletteReference Component
 *
 * Visual reference showing the new warm, human-centric color system
 * for the HR Command Center redesign
 */
export function ColorPaletteReference() {
  const colorGroups = [
    {
      name: 'Primary Colors',
      description: 'Warm terracotta and coral tones for main actions and emphasis',
      colors: [
        { name: 'Terracotta', value: '#E07856', usage: 'Primary buttons, active states' },
        { name: 'Deep Coral', value: '#D4704A', usage: 'Hover states, focused elements' },
        { name: 'Soft Coral', value: '#F0A58F', usage: 'Subtle highlights' },
      ],
    },
    {
      name: 'Secondary Colors',
      description: 'Sage green for balance and organic feel',
      colors: [
        { name: 'Sage Green', value: '#8B9D83', usage: 'Secondary actions, success states' },
        { name: 'Light Sage', value: '#A8B89B', usage: 'Hover states on secondary elements' },
        { name: 'Soft Sage', value: '#C5D4BC', usage: 'Subtle backgrounds' },
      ],
    },
    {
      name: 'Accent Colors',
      description: 'Warm amber and gold for highlights and special emphasis',
      colors: [
        { name: 'Amber', value: '#E6A852', usage: 'Accent highlights, notifications' },
        { name: 'Gold', value: '#D4A855', usage: 'Premium features, achievements' },
        { name: 'Soft Amber', value: '#F5C98E', usage: 'Subtle warnings' },
      ],
    },
    {
      name: 'Background Colors',
      description: 'Warm cream and beige tones replacing dark grays',
      colors: [
        { name: 'Warm Cream', value: '#F5F1E8', usage: 'Main background' },
        { name: 'Soft Beige', value: '#EDE7DC', usage: 'Subtle contrast areas' },
        { name: 'Card White', value: '#FEFDFB', usage: 'Card backgrounds' },
      ],
    },
    {
      name: 'Text Colors',
      description: 'Deep charcoal replacing harsh whites',
      colors: [
        { name: 'Deep Charcoal', value: '#2C2C2C', usage: 'Primary text' },
        { name: 'Warm Gray', value: '#6B6B6B', usage: 'Secondary text' },
        { name: 'Soft Gray', value: '#9A9A9A', usage: 'Tertiary text, hints' },
      ],
    },
    {
      name: 'Functional Colors',
      description: 'Earth-toned alternatives for charts and data visualization',
      colors: [
        { name: 'Clay', value: '#C87F5D', usage: 'Chart color 1' },
        { name: 'Forest', value: '#6B8E6F', usage: 'Chart color 2' },
        { name: 'Mustard', value: '#D4B05E', usage: 'Chart color 3' },
        { name: 'Sienna', value: '#9C6B5A', usage: 'Chart color 4' },
        { name: 'Olive', value: '#8A9A7B', usage: 'Chart color 5' },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F1E8' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              color: '#2C2C2C',
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            HR Command Center
          </h1>
          <p
            className="text-xl mb-2"
            style={{
              color: '#E07856',
              fontWeight: 600
            }}
          >
            Warm & Human-Centric Design System
          </p>
          <p
            className="text-base"
            style={{ color: '#6B6B6B' }}
          >
            A welcoming, approachable aesthetic designed for HR professionals
          </p>
        </motion.div>

        {/* Design Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-8 rounded-2xl"
          style={{
            backgroundColor: '#FEFDFB',
            border: '2px solid #EDE7DC',
            boxShadow: '0 4px 20px rgba(224, 120, 86, 0.08)'
          }}
        >
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ color: '#2C2C2C' }}
          >
            Design Principles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Warm & Inviting',
                description: 'Earth tones create a welcoming atmosphere that feels human and approachable',
                icon: '🌿',
              },
              {
                title: 'Generous Spacing',
                description: 'Breathable layouts with 12-16px rounded corners for organic, soft edges',
                icon: '✨',
              },
              {
                title: 'Soft Shadows',
                description: 'Warm-tinted shadows that feel natural rather than harsh digital overlays',
                icon: '☀️',
              },
            ].map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <div className="text-3xl mb-3">{principle.icon}</div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: '#E07856' }}
                >
                  {principle.title}
                </h3>
                <p style={{ color: '#6B6B6B', fontSize: '14px', lineHeight: '1.6' }}>
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Color Palette Groups */}
        <div className="space-y-8">
          {colorGroups.map((group, groupIndex) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + groupIndex * 0.1 }}
              className="p-8 rounded-2xl"
              style={{
                backgroundColor: '#FEFDFB',
                border: '2px solid #EDE7DC',
                boxShadow: '0 2px 12px rgba(140, 157, 131, 0.06)'
              }}
            >
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: '#2C2C2C' }}
              >
                {group.name}
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: '#6B6B6B' }}
              >
                {group.description}
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {group.colors.map((color, colorIndex) => (
                  <motion.div
                    key={color.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + groupIndex * 0.1 + colorIndex * 0.05 }}
                    className="group"
                  >
                    {/* Color Swatch */}
                    <div
                      className="w-full h-32 rounded-xl mb-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                      style={{
                        backgroundColor: color.value,
                        boxShadow: `0 4px 16px ${color.value}40`,
                      }}
                    />

                    {/* Color Info */}
                    <div>
                      <h3
                        className="text-lg font-semibold mb-1"
                        style={{ color: '#2C2C2C' }}
                      >
                        {color.name}
                      </h3>
                      <p
                        className="font-mono text-sm mb-2"
                        style={{ color: '#9A9A9A' }}
                      >
                        {color.value}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: '#6B6B6B', lineHeight: '1.5' }}
                      >
                        {color.usage}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Component Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 p-8 rounded-2xl"
          style={{
            backgroundColor: '#FEFDFB',
            border: '2px solid #EDE7DC',
          }}
        >
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ color: '#2C2C2C' }}
          >
            Component Previews
          </h2>

          {/* Button Examples */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold" style={{ color: '#6B6B6B' }}>Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: '#E07856',
                  color: '#FEFDFB',
                  boxShadow: '0 4px 12px rgba(224, 120, 86, 0.3)',
                }}
              >
                Primary Action
              </button>

              <button
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: '#8B9D83',
                  color: '#FEFDFB',
                  boxShadow: '0 4px 12px rgba(139, 157, 131, 0.3)',
                }}
              >
                Secondary Action
              </button>

              <button
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: '#FEFDFB',
                  color: '#E07856',
                  border: '2px solid #E07856',
                }}
              >
                Outline
              </button>
            </div>
          </div>

          {/* Card Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: '#6B6B6B' }}>Card</h3>
            <div
              className="p-6 rounded-2xl transition-all duration-300 hover:scale-102"
              style={{
                backgroundColor: '#FEFDFB',
                border: '2px solid #EDE7DC',
                boxShadow: '0 6px 20px rgba(224, 120, 86, 0.12)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: '#F5F1E8',
                    color: '#E07856',
                  }}
                >
                  👤
                </div>
                <div>
                  <h4 className="font-semibold text-lg" style={{ color: '#2C2C2C' }}>
                    Total Headcount
                  </h4>
                  <p className="text-sm" style={{ color: '#6B6B6B' }}>
                    Live data
                  </p>
                </div>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#E07856' }}>
                156
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#EDE7DC' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: '#E07856',
                    width: '78%',
                    boxShadow: '0 0 8px rgba(224, 120, 86, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-12 text-center"
        >
          <p
            className="text-sm"
            style={{ color: '#9A9A9A' }}
          >
            Designed for human connection • Built with warmth and purpose
          </p>
        </motion.div>
      </div>
    </div>
  );
}
