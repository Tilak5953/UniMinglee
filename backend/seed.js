const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./models/User');
const Community = require('./models/Community');
const Event = require('./models/Event');
const Message = require('./models/Message');
const Match = require('./models/Match');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniminglee');
    console.log('MongoDB connected for seeding...');

    // Clear DB
    await User.deleteMany();
    await Community.deleteMany();
    await Event.deleteMany();
    await Message.deleteMany();
    await Match.deleteMany();
    console.log('Database cleared.');

    // Encypt password helper
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create 8 Sample Users
    const users = await User.create([
      {
        name: 'Priya Sharma',
        email: 'priya@iitd.ac.in',
        password: hashedPassword,
        university: 'IIT Delhi',
        branch: 'Computer Science',
        year: '3rd Year',
        bio: 'Avid book reader, coding enthusiast, and absolute introvert. Love listening to indie-pop.',
        interests: ['Coding', 'Literature', 'Music', 'Anime'],
        skills: ['JavaScript', 'Python', 'React', 'Data Structures'],
        personalityType: 'introvert',
        profileImage: '',
        isOnline: true
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@bits-pilani.ac.in',
        password: hashedPassword,
        university: 'BITS Pilani',
        branch: 'Mechanical Engineering',
        year: '2nd Year',
        bio: 'Ambivert. Love photography, Formula 1, and playing guitar. Finding people to jam with.',
        interests: ['Photography', 'Music', 'Sports', 'Gaming'],
        skills: ['Guitar', 'SolidWorks', 'Photoshop', 'C++'],
        personalityType: 'ambivert',
        profileImage: '',
        isOnline: false
      },
      {
        name: 'Ananya Krishnan',
        email: 'ananya@nitt.edu',
        password: hashedPassword,
        university: 'NIT Trichy',
        branch: 'Electronics & Communication',
        year: '4th Year',
        bio: 'Anime lover, drawing artist, and proud introvert. Let\'s build something together or discuss manga.',
        interests: ['Anime', 'Art', 'Coding', 'Literature'],
        skills: ['Sketching', 'Java', 'Algorithms', 'UI/UX Design'],
        personalityType: 'introvert',
        profileImage: '',
        isOnline: true
      },
      {
        name: 'Arjun Mehta',
        email: 'arjun@vit.ac.in',
        password: hashedPassword,
        university: 'VIT Vellore',
        branch: 'Information Technology',
        year: '1st Year',
        bio: 'Extrovert at fests, introvert in classrooms. Gamer, coder, and sports enthusiast.',
        interests: ['Gaming', 'Coding', 'Sports', 'Music'],
        skills: ['Web Design', 'Valorant', 'Python', 'Content Writing'],
        personalityType: 'ambivert',
        profileImage: '',
        isOnline: false
      },
      {
        name: 'Kavya Nair',
        email: 'kavya@iitb.ac.in',
        password: hashedPassword,
        university: 'IIT Bombay',
        branch: 'Chemical Engineering',
        year: '3rd Year',
        bio: 'Introvert. Writing poetry and taking nature photos is my therapy. Love stargazing.',
        interests: ['Literature', 'Photography', 'Science', 'Art'],
        skills: ['Poetry', 'Lightroom', 'MATLAB', 'Creative Writing'],
        personalityType: 'introvert',
        profileImage: '',
        isOnline: true
      },
      {
        name: 'Ishaan Gupta',
        email: 'ishaan@dtu.ac.in',
        password: hashedPassword,
        university: 'Delhi Technological University',
        branch: 'Software Engineering',
        year: '2nd Year',
        bio: 'Ambivert. Hackathon enthusiast, tech geek, and coffee addict. Down for sports too.',
        interests: ['Coding', 'Science', 'Sports', 'Gaming'],
        skills: ['Node.js', 'MongoDB', 'React Native', 'Basketball'],
        personalityType: 'ambivert',
        profileImage: '',
        isOnline: true
      },
      {
        name: 'Diya Sen',
        email: 'diya@ju.edu',
        password: hashedPassword,
        university: 'Jadavpur University',
        branch: 'Comparative Literature',
        year: '2nd Year',
        bio: 'Introvert. I speak through my sketches and playlist. Passionate about art, books, and indie films.',
        interests: ['Art', 'Literature', 'Music', 'Photography'],
        skills: ['Watercolors', 'Storytelling', 'Video Editing', 'Spanish'],
        personalityType: 'introvert',
        profileImage: '',
        isOnline: false
      },
      {
        name: 'Rohan Malhotra',
        email: 'rohan@nsut.ac.in',
        password: hashedPassword,
        university: 'NSUT Delhi',
        branch: 'Instrumentation & Control',
        year: '4th Year',
        bio: 'Extrovert. Sports buff and fitness enthusiast. Love organizing tournaments.',
        interests: ['Sports', 'Music', 'Gaming', 'Anime'],
        skills: ['Event Management', 'Public Speaking', 'Football', 'Python'],
        personalityType: 'extrovert',
        profileImage: '',
        isOnline: false
      }
    ]);

    console.log('Users seeded.');

    // Extract User IDs
    const [priya, rahul, ananya, arjun, kavya, ishaan, diya, rohan] = users;

    // Create 8 Sample Communities
    const communities = await Community.create([
      {
        name: 'Coding Ninjas',
        description: 'A quiet place for developers to collaborate, solve DSA problems, build cool projects, and discuss system design without social anxiety.',
        category: 'coding',
        icon: '💻',
        admin: priya._id,
        members: [priya._id, ananya._id, arjun._id, ishaan._id],
        tags: ['DSA', 'WebDev', 'Hackathons', 'OpenSource'],
        university: 'IIT Delhi'
      },
      {
        name: 'Lofi & Indie Music Jam',
        description: 'For students who love lo-fi beats, indie bands, bedroom pop, or playing instruments in peaceful acoustic sessions.',
        category: 'music',
        icon: '🎵',
        admin: rahul._id,
        members: [rahul._id, priya._id, arjun._id, diya._id],
        tags: ['Acoustic', 'Lofi', 'Indie', 'Guitar'],
        university: 'BITS Pilani'
      },
      {
        name: 'Manga & Anime Alliance',
        description: 'Weekly discussions about manga releases, anime reviews, cosplays, and sharing art. Spoilers allowed with tags!',
        category: 'anime',
        icon: '🎌',
        admin: ananya._id,
        members: [ananya._id, priya._id, arjun._id, rohan._id],
        tags: ['Manga', 'Otaku', 'Cosplay', 'Art'],
        university: 'NIT Trichy'
      },
      {
        name: 'Shutterbugs & Nature Walkers',
        description: 'For hobbyist photographers to share clicks, learn edits, and join silent nature walk photo walks.',
        category: 'photography',
        icon: '📸',
        admin: rahul._id,
        members: [rahul._id, kavya._id, diya._id],
        tags: ['Landscape', 'MobilePhotography', 'Lightroom', 'Editing'],
        university: 'BITS Pilani'
      },
      {
        name: 'Silent Readers & Writers',
        description: 'A community for bibliophiles, poets, and prose writers to discuss literature, share write-ups, or join silent reading meetups.',
        category: 'literature',
        icon: '📚',
        admin: kavya._id,
        members: [kavya._id, priya._id, ananya._id, diya._id],
        tags: ['Poetry', 'Novels', 'CreativeWriting', 'BookClub'],
        university: 'IIT Bombay'
      },
      {
        name: 'E-Sports League',
        description: 'Casual and competitive gaming community. Finding teammates for Valorant, BGMI, Rocket League, or FIFA matches.',
        category: 'gaming',
        icon: '🎮',
        admin: arjun._id,
        members: [arjun._id, rahul._id, ishaan._id, rohan._id],
        tags: ['Valorant', 'FIFA', 'BGMI', 'CoD'],
        university: 'VIT Vellore'
      },
      {
        name: 'Sketching & Doodling Club',
        description: 'No experience needed! Share your quick sketches, doodles, watercolors, and digital illustrations.',
        category: 'art',
        icon: '🎨',
        admin: diya._id,
        members: [diya._id, ananya._id, kavya._id],
        tags: ['Watercolors', 'Doodling', 'DigitalArt', 'AnimeArt'],
        university: 'Jadavpur University'
      },
      {
        name: 'Tech & AI Exploration',
        description: 'Let\'s talk about AI, machine learning, robotics, and future science breakthroughs.',
        category: 'science',
        icon: '🔬',
        admin: ishaan._id,
        members: [ishaan._id, priya._id, kavya._id],
        tags: ['AI', 'ML', 'Robotics', 'Web3'],
        university: 'Delhi Technological University'
      }
    ]);

    console.log('Communities seeded.');

    // Save community relations back to users
    for (const c of communities) {
      for (const mId of c.members) {
        await User.findByIdAndUpdate(mId, { $addToSet: { communities: c._id } });
      }
    }

    // Create 10 Campus Events
    const events = await Event.create([
      {
        title: 'HackVerse 2026',
        description: 'A 24-hour campus hackathon to build open-source products. Pitch your ideas in a friendly, supportive atmosphere. Mentorship available throughout.',
        category: 'hackathons',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // In 10 days
        venue: 'Seminar Hall, IIT Delhi',
        image: '',
        organizer: priya._id,
        registeredUsers: [priya._id, ananya._id, ishaan._id],
        savedBy: [priya._id, ishaan._id],
        university: 'IIT Delhi',
        tags: ['Hackathon', 'Coding', 'OpenSource']
      },
      {
        title: 'Lofi Sunset Jam',
        description: 'A relaxed evening event near the lake. Bring your guitar, keyboard, or just yourself to listen to soft unplugged acoustic jams.',
        category: 'cultural',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // In 15 days
        venue: 'Rotunda Amphitheatre, BITS Pilani',
        image: '',
        organizer: rahul._id,
        registeredUsers: [rahul._id, priya._id, diya._id],
        savedBy: [diya._id],
        university: 'BITS Pilani',
        tags: ['Acoustic', 'Music', 'Chill']
      },
      {
        title: 'Stargazing & Astronomy Walk',
        description: 'Join us for a silent night walk to the campus observatory. We will look at stars, discuss space exploration, and share stories under the moon.',
        category: 'workshops',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // In 5 days
        venue: 'Observatory Hill, IIT Bombay',
        image: '',
        organizer: kavya._id,
        registeredUsers: [kavya._id, priya._id, ishaan._id],
        savedBy: [kavya._id, priya._id],
        university: 'IIT Bombay',
        tags: ['Science', 'Stargazing', 'Nature']
      },
      {
        title: 'UI/UX Design Masterclass',
        description: 'Learn modern wireframing and design layouts in Figma. Perfect for developers who want to learn how to make user interfaces that feel clean and modern.',
        category: 'workshops',
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // In 20 days
        venue: 'LT-2, NIT Trichy',
        image: '',
        organizer: ananya._id,
        registeredUsers: [ananya._id, priya._id, arjun._id],
        savedBy: [priya._id],
        university: 'NIT Trichy',
        tags: ['Figma', 'UIUX', 'Design']
      },
      {
        title: 'Valorant Campus Cup',
        description: 'Annual competitive Valorant tournament. Form teams of 5 or register solo to get matched with teammates. Cozy gaming setup with snacks.',
        category: 'sports',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // In 8 days
        venue: 'Gaming Lounge, VIT Vellore',
        image: '',
        organizer: arjun._id,
        registeredUsers: [arjun._id, rahul._id, rohan._id],
        savedBy: [ishaan._id],
        university: 'VIT Vellore',
        tags: ['Gaming', 'Valorant', 'Esports']
      },
      {
        title: 'Intro to Web Development',
        description: 'Learn HTML, CSS, and basic JavaScript. Hands-on coding session for beginners. Bring your laptops.',
        category: 'technical',
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        venue: 'Computer Lab 3, DTU Delhi',
        image: '',
        organizer: ishaan._id,
        registeredUsers: [ishaan._id, arjun._id, priya._id],
        savedBy: [arjun._id],
        university: 'Delhi Technological University',
        tags: ['WebDev', 'HTML', 'JavaScript']
      },
      {
        title: 'Creative Writing Workshop',
        description: 'A cozy workshop format. We will share prompts, write silent poetry or prose, and share them with the circle if we wish to.',
        category: 'workshops',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        venue: 'Library Annex, Jadavpur University',
        image: '',
        organizer: diya._id,
        registeredUsers: [diya._id, kavya._id, priya._id],
        savedBy: [kavya._id],
        university: 'Jadavpur University',
        tags: ['Poetry', 'Writing', 'Storytelling']
      },
      {
        title: 'Futsal Friendly Match',
        description: 'Weekend friendly futsal session. Play 5-a-side matches. All skill levels welcome, it\'s just for fun.',
        category: 'sports',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        venue: 'Sports Field, NSUT Delhi',
        image: '',
        organizer: rohan._id,
        registeredUsers: [rohan._id, arjun._id, ishaan._id],
        savedBy: [ishaan._id],
        university: 'NSUT Delhi',
        tags: ['Futsal', 'Football', 'Sports']
      },
      {
        title: 'Anime Movie Night',
        description: 'Screening of classic movies. Comfy seating, free popcorn, and discussions post screening.',
        category: 'cultural',
        date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        venue: 'Audi 3, NIT Trichy',
        image: '',
        organizer: ananya._id,
        registeredUsers: [ananya._id, priya._id, arjun._id, rohan._id],
        savedBy: [priya._id, arjun._id],
        university: 'NIT Trichy',
        tags: ['Anime', 'Movie', 'Screening']
      },
      {
        title: 'Photo Editing Tips',
        description: 'Learn color correction, maskings, and overlays using Adobe Lightroom and Photoshop Mobile.',
        category: 'workshops',
        date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        venue: 'Media Center, BITS Pilani',
        image: '',
        organizer: rahul._id,
        registeredUsers: [rahul._id, kavya._id, diya._id],
        savedBy: [diya._id],
        university: 'BITS Pilani',
        tags: ['Lightroom', 'Editing', 'Photography']
      }
    ]);

    console.log('Events seeded.');

    // Save event relations back to users
    for (const e of events) {
      for (const regId of e.registeredUsers) {
        await User.findByIdAndUpdate(regId, { $addToSet: { savedEvents: e._id } });
      }
    }

    // Create Initial Messages
    await Message.create([
      {
        sender: priya._id,
        receiver: ananya._id,
        content: 'Hi Ananya! I saw you are also in the Manga & Anime Alliance. Have you read the latest chapter of Jujutsu Kaisen?',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
      },
      {
        sender: ananya._id,
        receiver: priya._id,
        content: 'OMG yes! The fight is so intense. Gojo is absolute goat. Let\'s catch up and talk more!',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 3.5)
      },
      {
        sender: rahul._id,
        receiver: priya._id,
        content: 'Hey Priya, you mentioned in your profile that you listen to indie-pop. Have you checked out Local Train or When Chai Met Toast?',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      {
        sender: priya._id,
        receiver: rahul._id,
        content: 'Hey Rahul! Yes, When Chai Met Toast is literally my absolute favorite! Yellow Paper Daisy is my comfort song.',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 1.5)
      },
      {
        sender: rahul._id,
        receiver: priya._id,
        content: 'Mine too! I\'m learning to play the chords on guitar. We should jam sometime if you want to!',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 1)
      }
    ]);

    console.log('Messages seeded.');

    // Create Match records
    await Match.create([
      {
        user1: priya._id,
        user2: ananya._id,
        compatibilityScore: 88,
        sharedInterests: ['Coding', 'Anime', 'Literature'],
        status: 'accepted'
      },
      {
        user1: rahul._id,
        user2: priya._id,
        compatibilityScore: 78,
        sharedInterests: ['Music'],
        status: 'pending' // Pending request to Priya
      },
      {
        user1: kavya._id,
        user2: priya._id,
        compatibilityScore: 92,
        sharedInterests: ['Literature', 'Art'],
        status: 'accepted'
      },
      {
        user1: ishaan._id,
        user2: priya._id,
        compatibilityScore: 85,
        sharedInterests: ['Coding'],
        status: 'accepted'
      },
      {
        user1: arjun._id,
        user2: rahul._id,
        compatibilityScore: 75,
        sharedInterests: ['Gaming', 'Sports', 'Music'],
        status: 'accepted'
      },
      {
        user1: diya._id,
        user2: ananya._id,
        compatibilityScore: 80,
        sharedInterests: ['Art', 'Literature'],
        status: 'pending' // Pending request to Ananya
      }
    ]);

    console.log('Matches seeded.');

    console.log('Data successfully seeded!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
