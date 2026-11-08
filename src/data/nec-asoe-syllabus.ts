import { SyllabusChapter, SyllabusSection } from '@/types/mcq';

/**
 * Official Nepal Engineering Council (NEC) Registration Examination
 * Software Engineering Syllabus (ASoE) — Chapters 1 to 10 (60 Sub-sections)
 */
export const NEC_ASOE_SYLLABUS: SyllabusChapter[] = [
  {
    chapterNumber: 1,
    chapterCode: 'ASoE01',
    title: 'Fundamentals of Information Technology',
    category: 'Fundamentals & Principles',
    sections: [
      {
        sectionId: '1.1',
        syllabusCode: 'ASoE0101',
        chapterNumber: 1,
        title: 'Introduction to Information Technology',
        topics:
          'Introduction, Definition, Characteristics of computer, Evolution of Computer, Block Diagram Of a computer, Generations of Computer, Classification of Computers, Applications of Computer, Capabilities and limitations of computer.',
      },
      {
        sectionId: '1.2',
        syllabusCode: 'ASoE0102',
        chapterNumber: 1,
        title: 'Storage system',
        topics:
          'Primary versus Secondary Storage, Data storage & retrieval methods. Primary Storage: RAM, ROM, PROM, EPROM, EEPROM. Secondary Storage: Magnetic Tapes, Magnetic Disks, Cartridge tape, hard disks, Optical Disks, Compact Disks, Zip Drive, Flash Drives.',
      },
      {
        sectionId: '1.3',
        syllabusCode: 'ASoE0103',
        chapterNumber: 1,
        title: 'Software',
        topics:
          'Software and its needs, Types of S/W. System Software: Operating System, Utility Programs. Programming Language: Machine Language, Assembly Language, High Level Language their advantages & disadvantages. Application software and its types: Word Processing, Spread Sheets, Presentation, Graphics, DBMS s/w.',
      },
      {
        sectionId: '1.4',
        syllabusCode: 'ASoE0104',
        chapterNumber: 1,
        title: 'Computer networks',
        topics:
          'Networking models, OSI model and TCP/IP model, Different layers of OSI and TCP/IP and their significance, Networking Devices (Hubs, Bridges, Switches, and Routers) and Transmission media, Protocols and Standards, Network security (attacks, cryptography, firewalls, etc.).',
      },
      {
        sectionId: '1.5',
        syllabusCode: 'ASoE0105',
        chapterNumber: 1,
        title: 'Data communication',
        topics:
          'Communication Process, Data Transmission speed, Communication Types (modes), Data Transmission Medias, Modem and its working, characteristics, Types of Networks, LAN Topologies, Computer Protocols, Concepts relating to networking.',
      },
      {
        sectionId: '1.6',
        syllabusCode: 'ASoE0106',
        chapterNumber: 1,
        title: 'Business data processing',
        topics:
          'Introduction, data storage hierarchy, Method of organizing data, File Types, File Organization, File Utilities.',
      },
    ],
  },
  {
    chapterNumber: 2,
    chapterCode: 'ACtE08',
    title: 'Software Engineering and Object-Oriented Analysis & Design',
    category: 'Fundamentals & Principles',
    sections: [
      {
        sectionId: '2.1',
        syllabusCode: 'ACtE0801',
        chapterNumber: 2,
        title: 'Software process and requirements',
        topics:
          'Software characteristics, Software quality attributes, Software process model (Agile Model, V-Model, Iterative Model, Prototype Model, and Big Bang Model), CASE, Functional and non-functional requirements, User requirements, System requirement, Interface specification, SRS documents, Requirement elicitation, analysis, validation and management.',
      },
      {
        sectionId: '2.2',
        syllabusCode: 'ACtE0802',
        chapterNumber: 2,
        title: 'Software design',
        topics:
          'Design process, Design Concepts, Design Mode, Design Heuristic, Architectural design decisions, System organization, Modular decomposition styles, Control styles, Reference architectures, Multiprocessor architecture, Client-server architectures, Distributed object architectures, Inter-organizational distributed computing, Real-time software design, Component-based software engineering.',
      },
      {
        sectionId: '2.3',
        syllabusCode: 'ACtE0803',
        chapterNumber: 2,
        title: 'Software testing, cost estimation, quality management, and configuration management',
        topics:
          'Unit Testing, Integration testing, System testing, Component testing, Acceptance Testing, Test case design, Test automation, Metrics for testing, Algorithmic cost modeling, Project duration and staffing, Software quality assurance, Formal technical reviews, Statistical SQA, Software metrics, ISO standards, CMMI, SQA plan, Configuration management planning, Change management, Version and release management, CASE tools.',
      },
      {
        sectionId: '2.4',
        syllabusCode: 'ACtE0804',
        chapterNumber: 2,
        title: 'Object-oriented fundamentals and analysis',
        topics:
          'Defining Models, Requirement Process, Use Cases, Object Oriented Development Cycle, Unified Modeling Language, Building Conceptual Model, Adding Associations and Attributes, Representation of System Behavior.',
      },
      {
        sectionId: '2.5',
        syllabusCode: 'ACtE0805',
        chapterNumber: 2,
        title: 'Object-oriented design',
        topics:
          'Analysis to Design, Describing and Elaborating Use Cases, Collaboration Diagram, Objects and Patterns, Determining Visibility, Class Diagram.',
      },
      {
        sectionId: '2.6',
        syllabusCode: 'ACtE0806',
        chapterNumber: 2,
        title: 'Object-oriented design implementation',
        topics:
          'Programming and Development Process, Mapping Design to Code, Creating Class Definitions from Design Class Diagrams, Creating Methods from Collaboration Diagram, Updating Class Definitions, Classes in Code, Exception and Error Handling.',
      },
    ],
  },
  {
    chapterNumber: 3,
    chapterCode: 'ASoE03',
    title: 'Programming Language and Its Applications',
    category: 'Fundamentals & Principles',
    sections: [
      {
        sectionId: '3.1',
        syllabusCode: 'ASoE0301',
        chapterNumber: 3,
        title: 'Procedure and parallel programming languages',
        topics:
          'General features, Data types, Abstract Data Types (ADT), Structuring, Syntax, Semantics, User-defined functions, Recursive functions, Array (1-D, 2-D, Multi-dimensional), String manipulations, RAM model of computation; Concurrent programming languages: message passing, loosely coupled system, shared memory, PRAM, monitor, semaphore.',
      },
      {
        sectionId: '3.2',
        syllabusCode: 'ASoE0302',
        chapterNumber: 3,
        title: 'Exception handling in various languages',
        topics:
          'Exception types and Exception Handling Constructs (try, catch, throw), Programming Events, Handling Large Databases, Special Languages.',
      },
      {
        sectionId: '3.3',
        syllabusCode: 'ASoE0303',
        chapterNumber: 3,
        title: 'Pointers, structure and data files in C programming',
        topics:
          'Pointer Arithmetic, Pointer and array, passing pointer to function, Structure vs Union, array of structure, passing structure to function, structure and pointer, Input/output operations on files, Sequential and Random Access to File.',
      },
      {
        sectionId: '3.4',
        syllabusCode: 'ASoE0304',
        chapterNumber: 3,
        title: 'Object-oriented programming concepts',
        topics:
          'Classes and Objects, namespace, Function Overloading, Inline functions, Default Argument, Pass/Return by reference, Access Specifiers, Member Access, Polymorphism (static and dynamic), method overriding, Libraries/Packages, Interfaces, abstraction, encapsulation, data hiding, constructor, destructor, Garbage collection, Dynamic memory allocation, this Pointer, static Data Member and static Function, Friend Function and Friend Classes.',
      },
      {
        sectionId: '3.5',
        syllabusCode: 'ASoE0305',
        chapterNumber: 3,
        title: 'Streams, file handling',
        topics:
          'Defining opening and closing a file, Input/Output operations on files, Error handling during I/O, Stream Class Hierarchy for Console I/O, Unformatted and Formatted I/O with ios Member functions and Flags, Formatting with Manipulators, File I/O with Streams, File Access Pointers, Sequential and Random Access to File.',
      },
      {
        sectionId: '3.6',
        syllabusCode: 'ASoE0306',
        chapterNumber: 3,
        title: 'Templates',
        topics:
          'Function Template, Overloading Function Template, Class Template, Function Definition of Class Template, Standard Template Library (Containers, Algorithms, Iterators).',
      },
    ],
  },
  {
    chapterNumber: 4,
    chapterCode: 'ACtE07',
    title: 'Data Structures and Algorithm, Database System and Operating System',
    category: 'Fundamentals & Principles',
    sections: [
      {
        sectionId: '4.1',
        syllabusCode: 'ACtE0701',
        chapterNumber: 4,
        title: 'Introduction to data structure, list, linked lists and trees',
        topics:
          'Data types, data structures and ADT; time and space analysis (Big-O, Omega, Theta), Stack and queue implementation, infix to postfix conversion and evaluation, Static and dynamic list structure, Singly/Doubly/Circular Linked lists and operations, Binary tree operations, traversals (pre-order, post-order, in-order), Height, level and depth, AVL balanced trees.',
      },
      {
        sectionId: '4.2',
        syllabusCode: 'ACtE0702',
        chapterNumber: 4,
        title: 'Sorting, searching, and graphs',
        topics:
          "Internal and external sorting; Insertion, selection, exchange, Merge, Radix, Shell, Heap sort; Big-O efficiency; Sequential, Binary and Tree search; Hashing and collision resolution; Undirected and Directed Graphs, Warshall's algorithm, DFS and BFS, Topological sorting, Minimum spanning trees (Prim's, Kruskal's, Round-Robin), Shortest-path (Greedy, Dijkstra's).",
      },
      {
        sectionId: '4.3',
        syllabusCode: 'ACtE0703',
        chapterNumber: 4,
        title: 'Introduction to data models, normalization, and SQL',
        topics:
          'Data Abstraction and Independence, Schema and Instances, E-R Model, Strong and Weak Entity Sets, Attributes and Keys, Normal Forms (1NF, 2NF, 3NF, BCNF), Functional Dependencies, Integrity and Domain Constraints, DDL and DML SQL Queries, Views, Assertions and Triggers, Relational Algebra, Query Cost Estimation, Query Optimization and Decomposition.',
      },
      {
        sectionId: '4.4',
        syllabusCode: 'ACtE0704',
        chapterNumber: 4,
        title: 'Transaction processing, concurrency control and crash recovery',
        topics:
          'ACID properties, Concurrent Executions, Serializability Concept, Lock based Protocols, Deadlock handling and Prevention, Failure Classification, Recovery and Atomicity, Log-based Recovery.',
      },
      {
        sectionId: '4.5',
        syllabusCode: 'ACtE0705',
        chapterNumber: 4,
        title: 'Introduction to Operating System and process management',
        topics:
          'Evolution and Types of OS, OS Components, Structure and Services, Process description, states and control, Threads, Scheduling types, Principles of Concurrency, Critical Region, Race Condition, Mutual Exclusion, Semaphores and Mutex, Message Passing, Monitors, Classical Synchronization Problems.',
      },
      {
        sectionId: '4.6',
        syllabusCode: 'ACtE0706',
        chapterNumber: 4,
        title: 'Memory management, file systems and system administration',
        topics:
          'Memory address, Swapping and Free Memory Space, Virtual Memory Management, Demand Paging, Page Replacement Algorithms, File, Directory and Paths, File System Implementation, Fragmentation, Mapping File Blocks, File System Performance, Administration Tasks, User Account Management, Start and Shutdown Procedures.',
      },
    ],
  },
  {
    chapterNumber: 5,
    chapterCode: 'ASoE05',
    title: 'Microprocessor, Computer, Organization, and Architecture',
    category: 'Engineering Practice',
    sections: [
      {
        sectionId: '5.1',
        syllabusCode: 'ASoE0501',
        chapterNumber: 5,
        title: 'Programming with 8085 and 8086 microprocessors',
        topics:
          'Internal Architecture, Features, Instruction Format, Data Format, and Addressing Modes of 8085 & 8086 Microprocessors; Assembly Language Programming, EXE and COM programs, Assembling, Linking and Executing, One Pass and Two Pass Assemblers.',
      },
      {
        sectionId: '5.2',
        syllabusCode: 'ASoE0502',
        chapterNumber: 5,
        title: 'Microprocessor system',
        topics:
          'Memory Device Classification and Hierarchy, Interfacing I/O and Memory Parallel Interface, Programmable Peripheral Interface (PPI), Serial Interface, Synchronous and Asynchronous Transmission, Serial Interface Standards, Direct Memory Access (DMA) and DMA Controllers.',
      },
      {
        sectionId: '5.3',
        syllabusCode: 'ASoE0503',
        chapterNumber: 5,
        title: 'Interrupt operations',
        topics:
          "Interrupt, Interrupt Service Routine, Interrupt Processing in 8085 and 8086, Real and Pseudo-Parallelism, Flynn's Classification, Instruction/Thread/Process Level Parallelism, Resource Allocation and Deadlock, Features of Typical Operating System.",
      },
      {
        sectionId: '5.4',
        syllabusCode: 'ASoE0504',
        chapterNumber: 5,
        title: 'Control and central processing units',
        topics:
          'Control Memory, addressing sequencing, Computer configuration, Microinstruction Format, Design of control unit, CPU Structure and Function, ALU, Instruction formats, addressing modes, Data transfer and manipulation, RISC and CISC Pipelining parallel processing.',
      },
      {
        sectionId: '5.5',
        syllabusCode: 'ASoE0505',
        chapterNumber: 5,
        title: 'Computer arithmetic and memory system',
        topics:
          'Arithmetic and Logical operation, Memory Hierarchy, Internal and External memory, Cache memory principles and design (Cache size, Mapping function, Replacement algorithm, write policy, Number of caches), Memory Write Ability and Storage Permanence, Composing Memory.',
      },
      {
        sectionId: '5.6',
        syllabusCode: 'ASoE0506',
        chapterNumber: 5,
        title: 'Input-Output organization and multiprocessor',
        topics:
          'Peripheral devices, I/O modules, Input-output interface, Modes of transfer, Direct Memory access, Characteristics of multiprocessors, Interconnection Structure, Inter-processor Communication and synchronization.',
      },
    ],
  },
  {
    chapterNumber: 6,
    chapterCode: 'ASoE06',
    title: 'Analysis and Design of Algorithm, and Programming (System and Network)',
    category: 'Engineering Practice',
    sections: [
      {
        sectionId: '6.1',
        syllabusCode: 'ASoE0601',
        chapterNumber: 6,
        title: 'Foundations of algorithm analysis',
        topics:
          'Algorithms and basic properties, RAM model, Time and Space Complexity (best, worst, average case), Asymptotic Notations, Recurrence Relations, Recursion Tree Method, Substitution Method, Master Theorem.',
      },
      {
        sectionId: '6.2',
        syllabusCode: 'ASoE0602',
        chapterNumber: 6,
        title: 'Divide and conquer algorithms',
        topics:
          'Divide and conquer concepts, Binary Search, Min-Max algorithm, Merge Sort, Quick Sort and Randomized Quick Sort, Heap Data Structures (max, min) and Heap Sort, Order Statistics, Median order, Selection in Expected and Worst Case Linear Time.',
      },
      {
        sectionId: '6.3',
        syllabusCode: 'ASoE0603',
        chapterNumber: 6,
        title: 'Dynamic programming',
        topics:
          'Greedy vs Dynamic Programming, Recursion vs DP, Elements of DP, Matrix Chain Multiplication, String Editing Algorithm (Edit Distance), Knapsack problem, Floyd Warshall All-Pair Shortest Path, Travelling Salesman Problem, Memoization Strategy.',
      },
      {
        sectionId: '6.4',
        syllabusCode: 'ASoE0604',
        chapterNumber: 6,
        title: 'Loading, linker and macro processor',
        topics:
          'Basic Loader Concept, Absolute loader, Bootstrap Loader, Machine Dependent/Independent loader features, Relocations, Program Linking, Linking loader algorithms, Automatic library Search, Linkage Editors, Dynamic linking, MSDOS and SunOS linkers.',
      },
      {
        sectionId: '6.5',
        syllabusCode: 'ASoE0605',
        chapterNumber: 6,
        title: 'Macro processor basic',
        topics:
          'Macro Definition and Expansion, Macro Processor Algorithm and Data Structure, Machine Independent features, Concatenation of Macro Parameters, Generation of Unique labels, Conditional and Recursive Macro Expansion, Keyword Macro Parameter, MASM and ANSI C Macro languages.',
      },
      {
        sectionId: '6.6',
        syllabusCode: 'ASoE0606',
        chapterNumber: 6,
        title: 'Network Programming',
        topics:
          'Communication Protocols (TCP, IP, UDP, SCTP) and state transition diagrams, Sockets (UNIX, Winsock), Socket Address Structures, Byte ordering, Socket System Calls, Concurrent Servers, I/O models (blocking, non-blocking, multiplexing, signal driven, asynchronous), Winsock Architecture and DLL.',
      },
    ],
  },
  {
    chapterNumber: 7,
    chapterCode: 'ACtE09',
    title: 'Artificial Intelligence and Neural Networks',
    category: 'Engineering Practice',
    sections: [
      {
        sectionId: '7.1',
        syllabusCode: 'ACtE0901',
        chapterNumber: 7,
        title: 'Introduction to AI and intelligent agent',
        topics:
          'Concept, Perspectives, History, Applications, and Foundations of AI; Intelligent Agents, PEAS description, Agent Types (Simple Reflexive, Model Based, Goal Based, Utility Based), Environment Types (Deterministic, Stochastic, Static, Dynamic, Observable, Single/Multi Agent).',
      },
      {
        sectionId: '7.2',
        syllabusCode: 'ACtE0902',
        chapterNumber: 7,
        title: 'Problem solving and searching techniques',
        topics:
          'State space search, Problem formulation, Constraint satisfaction problem, Uninformed search (DFS, BFS, Depth Limited, Iterative Deepening, Bidirectional), Informed Search (Greedy Best-First, A*, Hill Climbing, Simulated Annealing), Game playing, Minimax Search, Alpha-Beta Pruning.',
      },
      {
        sectionId: '7.3',
        syllabusCode: 'ACtE0903',
        chapterNumber: 7,
        title: 'Knowledge representation',
        topics:
          "Knowledge Mappings, Semantic Nets, Frames, Propositional Logic (Syntax, Semantics, Connectives, Tautology, Validity, WFF, Resolution), Predicate Logic (FOPL, Quantification, Rules of inference, Unification, Resolution Refutation), Bayes' Rule, Bayesian/Belief Networks.",
      },
      {
        sectionId: '7.4',
        syllabusCode: 'ACtE0904',
        chapterNumber: 7,
        title: 'Expert system and natural language processing',
        topics:
          'Expert Systems Architecture, Knowledge acquisition, Declarative vs Procedural knowledge, NLP Terminology, NLU and NLG, Steps/Applications/Challenges of NLP, Machine Vision Concepts and Stages, Robotics.',
      },
      {
        sectionId: '7.5',
        syllabusCode: 'ACtE0905',
        chapterNumber: 7,
        title: 'Machine learning',
        topics:
          'Supervised, Unsupervised and Reinforcement Learning, Inductive learning (Decision Tree), Statistical-based Learning (Naive Bayes Model), Fuzzy learning and Inference Systems, Genetic Algorithms (Operators, Encoding, Selection, Fitness function, Parameters).',
      },
      {
        sectionId: '7.6',
        syllabusCode: 'ACtE0906',
        chapterNumber: 7,
        title: 'Neural networks',
        topics:
          'Biological vs Artificial Neural Networks (ANN), McCulloch-Pitts Neuron, Mathematical Model, Activation functions, Architectures, Perceptron, Learning Rate, Gradient Descent, Delta Rule, Hebbian learning, Adaline, MLP, Backpropagation Algorithm, Hopfield Neural Network.',
      },
    ],
  },
  {
    chapterNumber: 8,
    chapterCode: 'ASoE08',
    title: 'Java Programming and Web Technology',
    category: 'Engineering Practice',
    sections: [
      {
        sectionId: '8.1',
        syllabusCode: 'ASoE0801',
        chapterNumber: 8,
        title: 'Java basics and multithreading',
        topics:
          'JVM, JRE, JDK, Java OOP, Multithreading, Thread Class and Runnable Interface, Priorities, Synchronization, Deadlock, Thread Communication, Java Collection Interface, String Handling, Calendar and SimpleDateFormat, Formatting, Random class.',
      },
      {
        sectionId: '8.2',
        syllabusCode: 'ASoE0802',
        chapterNumber: 8,
        title: 'Java swing, AWT, event handling and JDBC',
        topics:
          'AWT classes and controls, Layout managers, Event handling mechanisms, Event classes and Listener Interfaces, Mouse/Keyboard/Action events, Swing features, MVC connection, Swing Components and containers.',
      },
      {
        sectionId: '8.3',
        syllabusCode: 'ASoE0803',
        chapterNumber: 8,
        title: 'J2EE, servlet programming and JSP programming',
        topics:
          'Core J2EE Technologies, Enterprise Architecture, Application Servers, GET and POST Request, Web Container, Servlet Technology, Deployment Descriptor, Session Management, Request dispatching, JSP Basics, Java Beans in JSP.',
      },
      {
        sectionId: '8.4',
        syllabusCode: 'ASoE0804',
        chapterNumber: 8,
        title: 'Introduction to web technology',
        topics:
          'Client Server Architecture, Web Site Design, HTML5 Tags, CSS3, Responsive design, Browser compatibility, XML, DTD, XSLT, XHTML, Cryptography, Authentication, Encryption/Decryption, Digital Certificates, Digital signature, SSL, VPN.',
      },
      {
        sectionId: '8.5',
        syllabusCode: 'ASoE0805',
        chapterNumber: 8,
        title: 'Client and server-side scripting',
        topics:
          'JavaScript (Operator, Control, DOM, Array, Object, Smart Form, Classes), jQuery (selectors, events, animations), PHP (Operators, Control, Arrays, Functions, Strings, Regex, Exceptions, OOP, Session, Database Connectivity, CRUD, Files, Email, CMS).',
      },
      {
        sectionId: '8.6',
        syllabusCode: 'ASoE0806',
        chapterNumber: 8,
        title: 'JDBC',
        topics:
          'Basics of JDBC, Database Drivers, JDBC Drivers, JDBC API, Statement and its types, ResultSet, metadata and CRUD operations.',
      },
    ],
  },
  {
    chapterNumber: 9,
    chapterCode: 'ASoE09',
    title: 'Real Time Systems, Distributed Systems, Cloud Computing',
    category: 'Engineering Practice',
    sections: [
      {
        sectionId: '9.1',
        syllabusCode: 'ASoE0901',
        chapterNumber: 9,
        title: 'Introduction to real time system and real time scheduling',
        topics:
          'Digital/High Level Control, Signal Processing, Release Times, Deadlines, Hard vs Soft Real Time Systems, Periodic Task Model, Precedence Constraints, Clock Driven, Weighted Round Robin, Priority Driven, EDF, LST, Rate Monotonic Algorithm, Offline vs Online Scheduling, Aperiodic and Sporadic jobs.',
      },
      {
        sectionId: '9.2',
        syllabusCode: 'ASoE0902',
        chapterNumber: 9,
        title: 'Resources sharing and real time communication',
        topics:
          'Resource Contention and RAC, Non-preemptive Critical Sections, Priority-Inheritance and Priority-Ceiling Protocols, Stack Based and Preemption Ceiling Protocols, Soft and Hard RT Communication, Priority-Based and WRR Service Disciplines, MAC for Broadcast Networks, Resource Reservation Protocols.',
      },
      {
        sectionId: '9.3',
        syllabusCode: 'ASoE0903',
        chapterNumber: 9,
        title: 'Introduction to distributed systems and cloud computing',
        topics:
          'Characteristics, Advantages/Disadvantages, and Models of Distributed Systems; Resource Sharing, Grid, Cluster, Cloud; Roots, Desired Features, Challenges, Risks, and Benefits of Cloud Computing.',
      },
      {
        sectionId: '9.4',
        syllabusCode: 'ASoE0904',
        chapterNumber: 9,
        title: 'Distributed file system and CORBA',
        topics:
          'Communication between distributed objects, RPC, Events and Notifications, DFS, File Service Architecture, Sun NFS, Name Services and DNS, Directory/Discovery Services, Heterogeneity, Middleware, Distributed Objects, CORBA approach and services.',
      },
      {
        sectionId: '9.5',
        syllabusCode: 'ASoE0905',
        chapterNumber: 9,
        title: 'Virtualization, cloud architecture, services and storage and cloud security',
        topics:
          'Load Balancing and Virtualization, Hypervisor, Seven Layers and Types of Virtualization, Cloud Reference Architecture, Public/Private/Hybrid Clouds, IaaS, PaaS, SaaS, Cloud Storage, Inter-Cloud Resource Management, Provisioning, Cloud/Data/App/VM/Infrastructure Security and Privacy.',
      },
      {
        sectionId: '9.6',
        syllabusCode: 'ASoE0906',
        chapterNumber: 9,
        title: 'Agreement in distributed system',
        topics:
          'Clock synchronization (logical and physical), distributed mutual exclusion (centralized, distributed and token based algorithms), fault-tolerant system, replication and its types.',
      },
    ],
  },
  {
    chapterNumber: 10,
    chapterCode: 'AALL10',
    title: 'Project Planning, Design and Implementation',
    category: 'Project Planning & Management',
    sections: [
      {
        sectionId: '10.1',
        syllabusCode: 'AALL1001',
        chapterNumber: 10,
        title: 'Engineering drawings and its concepts',
        topics:
          'Standard drawing sheets, dimensions, scale, line diagram, orthographic projection, isometric projection/view, pictorial views, sectional drawing.',
      },
      {
        sectionId: '10.2',
        syllabusCode: 'AALL1002',
        chapterNumber: 10,
        title: 'Engineering Economics',
        topics:
          'Project cash flow, discount rate, interest and time value of money; Discounted Payback Period, NPV, IRR & MARR; comparison of alternatives, depreciation system and taxation system in Nepal.',
      },
      {
        sectionId: '10.3',
        syllabusCode: 'AALL1003',
        chapterNumber: 10,
        title: 'Project planning and scheduling',
        topics:
          'Project classifications, project life cycle phases, project planning process, project scheduling (bar chart, CPM, PERT), resources levelling and smoothing, monitoring/evaluation/controlling.',
      },
      {
        sectionId: '10.4',
        syllabusCode: 'AALL1004',
        chapterNumber: 10,
        title: 'Project management',
        topics:
          'Information system, project risk analysis and management, project financing, tender and its process, contract management.',
      },
      {
        sectionId: '10.5',
        syllabusCode: 'AALL1005',
        chapterNumber: 10,
        title: 'Engineering professional practice',
        topics:
          'Environment and society, professional ethics, regulatory environment, contemporary issues/problems in engineering, occupational health and safety, roles/responsibilities of Nepal Engineers Association (NEA).',
      },
      {
        sectionId: '10.6',
        syllabusCode: 'AALL1006',
        chapterNumber: 10,
        title: 'Engineering Regulatory Body',
        topics: 'Nepal Engineering Council (Acts & Regulations).',
      },
    ],
  },
];

export const ALL_SYLLABUS_SECTIONS: SyllabusSection[] = NEC_ASOE_SYLLABUS.flatMap(
  (ch) => ch.sections
);

const SECTION_MAP = new Map<string, SyllabusSection>(
  ALL_SYLLABUS_SECTIONS.map((s) => [s.sectionId, s])
);

const CODE_MAP = new Map<string, SyllabusSection>(
  ALL_SYLLABUS_SECTIONS.map((s) => [s.syllabusCode.toLowerCase(), s])
);

const CHAPTER_MAP = new Map<number, SyllabusChapter>(
  NEC_ASOE_SYLLABUS.map((c) => [c.chapterNumber, c])
);

export function getChapterByNumber(chapterNumber: number): SyllabusChapter | undefined {
  return CHAPTER_MAP.get(chapterNumber);
}

export function getSectionById(sectionId: string): SyllabusSection | undefined {
  return SECTION_MAP.get(sectionId.trim());
}

export function getSectionByCode(code: string): SyllabusSection | undefined {
  return CODE_MAP.get(code.trim().toLowerCase());
}

/**
 * Resolves a sheet name, banner text, row metadata, or filename to an official NEC syllabus section.
 */
export function resolveSyllabusSection(hints: {
  sheetName?: string;
  bannerText?: string;
  rowSection?: string;
  rowChapter?: string;
  fileName?: string;
  fallbackChapter?: number;
  fallbackSection?: string;
}): {
  chapterNumber: number;
  sectionId: string;
  syllabusCode: string;
  sectionTitle: string;
} {
  const candidates = [
    hints.rowSection,
    hints.sheetName,
    hints.bannerText,
    hints.fallbackSection,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const trimmed = raw.trim();
    // 1. Direct code match e.g. ASoE0101
    const codeMatch = trimmed.match(/\b(ASoE\d{4}|ACtE\d{4}|AALL\d{4})\b/i);
    if (codeMatch) {
      const byCode = getSectionByCode(codeMatch[1]);
      if (byCode) {
        return {
          chapterNumber: byCode.chapterNumber,
          sectionId: byCode.sectionId,
          syllabusCode: byCode.syllabusCode,
          sectionTitle: byCode.title,
        };
      }
    }

    // 2. Exact X.Y match e.g. "1.1", "Section 1.4", "Chapter 1 - Section 1.1 ..."
    const secMatch = trimmed.match(/(?:^|\bSection\s+|\bSec\s*|\bCh\d+[_-\s]*)(\d{1,2}\.\d{1,2})\b/i)
      || trimmed.match(/^(\d{1,2}\.\d{1,2})\b/);
    if (secMatch) {
      const bySec = getSectionById(secMatch[1]);
      if (bySec) {
        return {
          chapterNumber: bySec.chapterNumber,
          sectionId: bySec.sectionId,
          syllabusCode: bySec.syllabusCode,
          sectionTitle: bySec.title,
        };
      }
    }
  }

  // 3. Infer chapter number from rowChapter, bannerText, or fileName (e.g. "...Ch1..." or "Chapter 2")
  const chapterHints = [hints.rowChapter, hints.bannerText, hints.sheetName, hints.fileName]
    .filter(Boolean)
    .join(' ');
  const chMatch = chapterHints.match(/\b(?:Chapter|Ch)[_-\s]*(\d{1,2})\b/i);
  const inferredCh = chMatch
    ? Number(chMatch[1])
    : hints.fallbackChapter && hints.fallbackChapter >= 1 && hints.fallbackChapter <= 10
    ? hints.fallbackChapter
    : 1;

  const ch = getChapterByNumber(inferredCh) ?? NEC_ASOE_SYLLABUS[0];
  const defaultSec = ch.sections[0];
  return {
    chapterNumber: ch.chapterNumber,
    sectionId: defaultSec.sectionId,
    syllabusCode: defaultSec.syllabusCode,
    sectionTitle: defaultSec.title,
  };
}

