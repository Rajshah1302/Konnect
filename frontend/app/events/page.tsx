import React from "react";
import { Users } from "lucide-react";

// Event subcomponent
const Event = ({ id, title, description, people }) => {
  return (
    <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-white/20 transition-all duration-500 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">
      <h3 className="text-xl line-clamp-1 font-medium text-white mb-3 leading-tight">
        {title}
      </h3>

      <p className="text-gray-400 mb-6 text-sm leading-relaxed line-clamp-2 font-light">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-300">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm font-light">{people}</span>
        </div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent rounded-full"></div>
      </div>
    </div>
  );
};

// Main Events Listing component
const EventsListing = () => {
  // Mock events data
  const mockEvents = [
    {
      id: 1,
      title: "React Conference 2025",
      description:
        "Join us for the biggest React conference of the year! Learn about the latest features, best practices, and connect with fellow developers from around the world.",
      people: 342,
    },
    {
      id: 2,
      title: "JavaScript Workshop: Advanced Patterns",
      description:
        "Deep dive into advanced JavaScript patterns and techniques. This hands-on workshop will cover closures, prototypes, async programming, and modern ES6+ features.",
      people: 89,
    },
    {
      id: 3,
      title: "UI/UX Design Masterclass",
      description:
        "Learn the fundamentals of user interface and user experience design. From wireframing to prototyping, discover how to create intuitive and beautiful digital experiences.",
      people: 156,
    },
    {
      id: 4,
      title: "DevOps Summit 2025",
      description:
        "Explore the latest in DevOps practices, tools, and methodologies. Sessions on CI/CD, containerization, cloud infrastructure, and automation best practices.",
      people: 278,
    },
    {
      id: 5,
      title: "Mobile Development Bootcamp",
      description:
        "Comprehensive bootcamp covering both iOS and Android development. Learn React Native, Flutter, and native development approaches with real-world projects.",
      people: 124,
    },
    {
      id: 6,
      title: "AI & Machine Learning Symposium",
      description:
        "Discover the latest advancements in artificial intelligence and machine learning. From neural networks to practical applications in business and research.",
      people: 445,
    },
  ];

  return (
    <div className="min-h-screen  bg-black py-16 px-6 ">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.map((event) => (
            <Event
              key={event.id}
              id={event.id}
              title={event.title}
              description={event.description}
              people={event.people}
            />
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="mt-24 flex justify-center">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="w-8 h-px bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsListing;
