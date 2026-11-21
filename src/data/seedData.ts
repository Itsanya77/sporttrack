import { 
  User, 
  Sport, 
  Equipment, 
  EquipmentRequest, 
  IssueRecord, 
  ReturnRecord, 
  LearningContent, 
  SystemSettings,
  LoginSettings,
  VideoItem,
  AppNotification
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  college_name: 'Dr. Moonje Institute of Management and Computer Studies',
  department: 'Sports Department',
  logo_url: '/college_logo.jpg',
  admin_email: 'sports@dmims.edu',
  sports_incharge_name: 'Faculty Sports In-Charge',
  academic_year: '2024-2025',
  contact_email: 'sports@dmims.edu',
  contact_phone: '+91 253 237 9801',
  max_borrow_duration_days: 7,
  fine_per_day: 10,
  require_selfie: false,
  auto_approve_enabled: false,
  overdue_reminder_days: 1,
  sample_data_watermark: false,
  allow_student_registration: true,
};

export const DEFAULT_LOGIN_SETTINGS: LoginSettings = {
  background_image: '', // Uses default stadium image if empty
  overlay_color: '#020617',
  overlay_opacity: 0.80,
  card_opacity: 0.95,
  college_name: 'Dr. Moonje Institute of Management and Computer Studies',
  welcome_text: 'Welcome to SportTrack',
  subtitle: 'Sports Equipment Management System',
  college_logo_url: '/college_logo.jpg',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_teacher_1',
    name: 'Faculty Sports In-Charge',
    username: 'teacher',
    email: 'teacher@moonjeinstitute.com',
    phone: '+91 98765 43210',
    password: 'teacher123',
    role: 'TEACHER',
    active: true,
    created_at: '2025-01-10T09:00:00.000Z',
  },
];

export const INITIAL_SPORTS: Sport[] = [
  {
    id: 'sport_cricket',
    name: 'Cricket',
    description: 'Bat-and-ball game played on the college sports ground and practice nets.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_football',
    name: 'Football',
    description: 'Association football played on collegiate standard grass turf.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_volleyball',
    name: 'Volleyball',
    description: 'Team sport in which two teams are separated by a net on outdoor court.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_basketball',
    name: 'Basketball',
    description: 'Fast team sport played on outdoor concrete basketball court.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_badminton',
    name: 'Badminton',
    description: 'Racket sport played with shuttlecocks in the indoor sports hall.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_tennis',
    name: 'Tennis',
    description: 'Lawn and hard-court tennis equipment with championship balls.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_tt',
    name: 'Table Tennis',
    description: 'Indoor fast-paced racket sport played on divided ITTF approved tables.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_athletics',
    name: 'Athletics',
    description: 'Track and field sports equipment including shot puts, javelins and batons.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_fitness',
    name: 'Gym Equipment',
    description: 'Gymnasium dumbbells, yoga mats, resistance bands, and skipping ropes.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_handball',
    name: 'Handball',
    description: 'Competitive team sport played on outdoor and indoor courts.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_baseball',
    name: 'Baseball',
    description: 'Collegiate baseball gear including regulation balls and bats.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_softball',
    name: 'Softball',
    description: 'Softball equipment for women and men tournament training.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_lagori',
    name: 'Lagori',
    description: 'Traditional Indian team game of seven stones / pitthu.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_khokho',
    name: 'Kho-Kho',
    description: 'Traditional tag sport played on outdoor mud/grass courts.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_training',
    name: 'Training & Conditioning',
    description: 'Field marker cones, agility ladders, and sports fitness drills.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_tugofwar',
    name: 'Tug of War',
    description: 'Inter-department collegiate strength and stamina rope contest.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_yoga',
    name: 'Yoga',
    description: 'Yoga mats and mind-body wellness training equipment.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_hockey',
    name: 'Hockey',
    description: 'Field hockey practice and match balls.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_flyingdisc',
    name: 'Flying Disc',
    description: 'Ultimate frisbee and recreational flying disc equipment.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_carrom',
    name: 'Carrom',
    description: 'Indoor tournament carrom boards and accessories.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_netball',
    name: 'Netball',
    description: 'Court netball gear for inter-college leagues.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sport_powerlifting',
    name: 'Powerlifting',
    description: 'Olympic barbell bars, squat racks, and weight training equipment.',
    active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
];

export const INITIAL_EQUIPMENT: Equipment[] = [];

export const INITIAL_REQUESTS: EquipmentRequest[] = [];

export const INITIAL_ISSUES: IssueRecord[] = [];

export const INITIAL_RETURNS: ReturnRecord[] = [];

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid_1',
    title: 'Badminton Footwork & Serve Mechanics',
    description: 'Comprehensive high-level footwork split-step drills and low backhand serve execution for tournament singles.',
    category: 'Badminton',
    youtube_url: 'https://www.youtube.com/watch?v=S2-G_ragp70',
    duration: '08:45',
    tags: ['Badminton', 'Techniques', 'Serve', 'Footwork'],
    thumbnail: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    published: true,
    created_at: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'vid_2',
    title: 'Cricket Batting Grip & Front Foot Defense',
    description: 'Proper V-grip positioning, high elbow alignment, and weight transfer for front foot defensive strokes against pace.',
    category: 'Cricket',
    youtube_url: 'https://www.youtube.com/watch?v=M576qujZe08',
    duration: '12:10',
    tags: ['Cricket', 'Batting', 'Drills', 'Defense'],
    thumbnail: 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?w=800&auto=format&fit=crop&q=80',
    published: true,
    created_at: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'vid_3',
    title: 'Full Body Dynamic Warm-Up for Collegiate Athletes',
    description: 'Essential 10-minute dynamic warm-up routine to prevent muscle strains and activate posterior chain before sports practice.',
    category: 'Warm-up',
    youtube_url: 'https://www.youtube.com/watch?v=uVtcmsfQG0I',
    duration: '10:00',
    tags: ['Fitness', 'Warm-up', 'Injury Prevention', 'Mobility'],
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    published: true,
    created_at: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'vid_4',
    title: 'Table Tennis Forehand Loop & Topspin Drive',
    description: 'Body rotation, waist engagement, and brush contact fundamentals for consistent topspin loops against push balls.',
    category: 'Table Tennis',
    youtube_url: 'https://www.youtube.com/watch?v=J98L5_4fN5s',
    duration: '07:20',
    tags: ['Table Tennis', 'Topspin', 'Forehand', 'Techniques'],
    thumbnail: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&auto=format&fit=crop&q=80',
    published: true,
    created_at: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'vid_5',
    title: 'Football Passing Accuracy & First Touch Control',
    description: 'Inside-of-the-foot pass accuracy drills, cushion reception, and directional touch under defensive pressure.',
    category: 'Football',
    youtube_url: 'https://www.youtube.com/watch?v=5rT884tM0b8',
    duration: '09:15',
    tags: ['Football', 'Passing', 'First Touch', 'Skills'],
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    published: true,
    created_at: '2025-02-10T00:00:00.000Z',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_3',
    title: 'Sports Hall Maintenance Scheduled',
    message: 'Indoor badminton court wooden flooring polishing this Saturday 2 PM.',
    type: 'INFO',
    target_role: 'ALL',
    created_at: '2025-03-11T10:00:00.000Z',
    read: false,
    target_tab: 'equipment',
    target_type: 'EQUIPMENT',
  },
];
