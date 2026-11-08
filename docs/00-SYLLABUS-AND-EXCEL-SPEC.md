# NEC Software Engineering (`ASoE`) Syllabus & Excel Data Specification

This document serves as the single source of truth for:
1. The **Nepal Engineering Council (NEC) Registration Examination — Software Engineering Syllabus (`ASoE`)** across all 10 chapters and 60 sub-sections.
2. The exact **Excel Workbook Schema** analyzed from `NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx` (and supported fallback formats).

---

## Part A: Official NEC Software Engineering Syllabus (`ASoE`)

- **Chapters 1–4**: Fundamentals / principles of concepts in software engineering.
- **Chapters 5–9**: Application of engineering principles in practice.
- **Chapter 10**: Project planning, design, and implementation.

### Chapter 1: Fundamentals of Information Technology (`ASoE01`) — *Fundamentals*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `1.1` | `ASoE0101` | Introduction to Information Technology | Introduction, Definition, Characteristics of computer, Evolution of Computer, Block Diagram Of a computer, Generations of Computer, Classification of Computers, Applications of Computer, Capabilities and limitations of computer. |
| `1.2` | `ASoE0102` | Storage system | Primary versus Secondary Storage, Data storage & retrieval methods. Primary Storage: RAM, ROM, PROM, EPROM, EEPROM. Secondary Storage: Magnetic Tapes, Magnetic Disks, Cartridge tape, hard disks, Optical Disks, Compact Disks, Zip Drive, Flash Drives. |
| `1.3` | `ASoE0103` | Software | Software and its needs, Types of S/W. System Software: Operating System, Utility Programs. Programming Language: Machine Language, Assembly Language, High Level Language their advantages & disadvantages. Application software and its types: Word Processing, Spread Sheets, Presentation, Graphics, DBMS s/w. |
| `1.4` | `ASoE0104` | Computer networks | Networking models, OSI model and TCP/IP model, Different layers of OSI and TCP/IP and their significance, Networking Devices (Hubs, Bridges, Switches, and Routers) and Transmission media, Protocols and Standards, Network security (attacks, cryptography, firewalls, etc.). |
| `1.5` | `ASoE0105` | Data communication | Communication Process, Data Transmission speed, Communication Types (modes), Data Transmission Medias, Modem and its working, characteristics, Types of Networks, LAN Topologies, Computer Protocols, Concepts relating to networking. |
| `1.6` | `ASoE0106` | Business data processing | Introduction, data storage hierarchy, Method of organizing data, File Types, File Organization, File Utilities. |

---

### Chapter 2: Software Engineering and Object-Oriented Analysis & Design (`ACtE08`) — *Fundamentals*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `2.1` | `ACtE0801` | Software process and requirements | Software characteristics, Software quality attributes, Software process model (Agile Model, V-Model, Iterative Model, Prototype Model, and Big Bang Model), CASE, Functional and non-functional requirements, User requirements, System requirement, Interface specification, SRS documents, Requirement elicitation, analysis, validation, and management. |
| `2.2` | `ACtE0802` | Software design | Design process, Design Concepts, Design Mode, Design Heuristic, Architectural design decisions, System organization, Modular decomposition styles, Control styles, Reference architectures, Multiprocessor architecture, Client-server architectures, Distributed object architectures, Inter-organizational distributed computing, Real-time software design, Component-based SE. |
| `2.3` | `ACtE0803` | Software testing, cost estimation, quality management, and configuration management | Unit, Integration, System, Component, Acceptance Testing, Test case design, Test automation, Metrics for testing, Algorithmic cost modeling, Project duration and staffing, SQA, Formal technical reviews, Statistical SQA, Software metrics, ISO standards, CMMI, SQA plan, Configuration management, Change/Version/Release management, CASE tools. |
| `2.4` | `ACtE0804` | Object-oriented fundamentals and analysis | Defining Models, Requirement Process, Use Cases, Object Oriented Development Cycle, Unified Modeling Language (UML), Building Conceptual Model, Adding Associations and Attributes, Representation of System Behavior. |
| `2.5` | `ACtE0805` | Object-oriented design | Analysis to Design, Describing and Elaborating Use Cases, Collaboration Diagram, Objects and Patterns, Determining Visibility, Class Diagram. |
| `2.6` | `ACtE0806` | Object-oriented design implementation | Programming and Development Process, Mapping Design to Code, Creating Class Definitions from Design Class Diagrams, Creating Methods from Collaboration Diagram, Updating Class Definitions, Classes in Code, Exception and Error Handling. |

---

### Chapter 3: Programming Language and Its Applications (`ASoE03`) — *Fundamentals*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `3.1` | `ASoE0301` | Procedure and parallel programming languages | General features, Data types, Abstract Data Types (ADT), Structuring, Syntax, Semantics, User-defined functions, Recursive functions, Array (1-D, 2-D, Multi-dimensional), String manipulations, RAM model of computation; Concurrent programming: message passing, loosely coupled system, shared memory, PRAM, monitor, semaphore. |
| `3.2` | `ASoE0302` | Exception handling in various languages | Exception types and Exception Handling Constructs (try, catch, throw), Programming Events, Handling Large Databases, Special Languages. |
| `3.3` | `ASoE0303` | Pointers, structure and data files in C programming | Pointer Arithmetic, Pointer and array, passing pointer to function, Structure vs Union, array of structure, passing structure to function, structure and pointer, Input/output operations on files, Sequential and Random Access to File. |
| `3.4` | `ASoE0304` | Object-oriented programming concepts | Classes and Objects, namespace, Function Overloading, Inline functions, Default Argument, Pass/Return by reference, Access Specifiers, Member Access, Polymorphism (static and dynamic), method overriding, Libraries/Packages, Interfaces, abstraction, encapsulation, data hiding, constructor, destructor, Garbage collection, Dynamic memory allocation, `this` Pointer, static members, Friend Function and Friend Classes. |
| `3.5` | `ASoE0305` | Streams, file handling | Defining opening and closing a file, I/O operations on files, Error handling during I/O, Stream Class Hierarchy for Console I/O, Unformatted & Formatted I/O with ios Member functions and Flags, Formatting with Manipulators, File I/O with Streams, File Access Pointers, Sequential and Random Access. |
| `3.6` | `ASoE0306` | Templates | Function Template, Overloading Function Template, Class Template, Function Definition of Class Template, Standard Template Library (Containers, Algorithms, Iterators). |

---

### Chapter 4: Data Structures and Algorithm, Database System and Operating System (`ACtE07`) — *Fundamentals*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `4.1` | `ACtE0701` | Introduction to data structure, list, linked lists and trees | Data types, data structures, ADT; time and space analysis (Big-O, Omega, Theta), Stack and queue implementation, infix to postfix & evaluation, Array & dynamic lists, Singly/Doubly/Circular Linked lists & operations, Binary tree operations, traversals (pre-order, post-order, in-order), Height/level/depth, AVL balanced trees. |
| `4.2` | `ACtE0702` | Sorting, searching, and graphs | Internal and external sorting; Insertion, selection, exchange, Merge, Radix, Shell, Heap sort & priority queue; Big-O efficiency; Sequential, Binary, Tree search; Hashing & collision resolution; Undirected/Directed Graphs, Warshall's algorithm, DFS/BFS, Topological sorting, MST (Prim's, Kruskal's, Round-Robin), Shortest-path (Greedy, Dijkstra's). |
| `4.3` | `ACtE0703` | Introduction to data models, normalization, and SQL | Data Abstraction & Independence, Schema and Instances, E-R Model, Strong/Weak Entity Sets, Attributes/Keys, Normal Forms (1NF, 2NF, 3NF, BCNF), Functional Dependencies, Integrity & Domain Constraints, DDL/DML SQL Queries, Views, Assertions, Triggers, Relational Algebra, Query Cost Estimation & Optimization. |
| `4.4` | `ACtE0704` | Transaction processing, concurrency control and crash recovery | ACID properties, Concurrent Executions, Serializability, Lock-based Protocols, Deadlock handling and Prevention, Failure Classification, Recovery and Atomicity, Log-based Recovery. |
| `4.5` | `ACtE0705` | Introduction to Operating System and process management | Evolution & Types of OS, OS Components/Structure/Services, Process states & control, Threads, Scheduling types, Concurrency, Critical Region, Race Condition, Mutual Exclusion, Semaphores and Mutex, Message Passing, Monitors, Classical Synchronization Problems. |
| `4.6` | `ACtE0706` | Memory management, file systems and system administration | Memory address, Swapping, Free Memory Space, Virtual Memory, Demand Paging, Page Replacement Algorithms, File/Directory/Paths, File System Implementation, Fragmentation, Disk Block Mapping, File System Performance, System Administration, User Account Management, Start/Shutdown Procedures. |

---

### Chapter 5: Microprocessor, Computer, Organization, and Architecture (`ASoE05`) — *Engineering Practice*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `5.1` | `ASoE0501` | Programming with 8085 and 8086 microprocessors | Internal Architecture, Features, Instruction/Data Format, and Addressing Modes of 8085 & 8086; Assembly Language Programming, EXE and COM programs, Assembling, Linking and Executing, One-Pass and Two-Pass Assemblers. |
| `5.2` | `ASoE0502` | Microprocessor system | Memory Device Classification and Hierarchy, Interfacing I/O and Memory Parallel Interface, Programmable Peripheral Interface (PPI), Serial Interface, Synchronous and Asynchronous Transmission, Serial Interface Standards, DMA and DMA Controllers. |
| `5.3` | `ASoE0503` | Interrupt operations | Interrupt, ISR, Interrupt Processing in 8085 & 8086, Real and Pseudo-Parallelism, Flynn's Classification, Instruction/Thread/Process Level Parallelism, Resource Allocation and Deadlock, Typical OS Features. |
| `5.4` | `ASoE0504` | Control and central processing units | Control Memory, addressing sequencing, Computer configuration, Microinstruction Format, Control unit design, CPU Structure and Function, ALU, Instruction formats, addressing modes, Data transfer/manipulation, RISC and CISC Pipelining parallel processing. |
| `5.5` | `ASoE0505` | Computer arithmetic and memory system | Arithmetic and Logical operations, Memory Hierarchy, Internal/External memory, Cache memory principles & design (size, mapping, replacement, write policy, number of caches), Memory Write Ability, Storage Permanence, Composing Memory. |
| `5.6` | `ASoE0506` | Input-Output organization and multiprocessor | Peripheral devices, I/O modules & interface, Modes of transfer, Direct Memory Access, Characteristics of multiprocessors, Interconnection Structure, Inter-processor Communication and synchronization. |

---

### Chapter 6: Analysis and Design of Algorithm, and Programming (System and Network) (`ASoE06`) — *Engineering Practice*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `6.1` | `ASoE0601` | Foundations of algorithm analysis | Algorithm properties, RAM model, Time and Space Complexity (best, worst, average), Asymptotic Notations, Recurrence Relations, Recursion Tree Method, Substitution Method, Master Theorem. |
| `6.2` | `ASoE0602` | Divide and conquer algorithms | Divide and conquer concepts, Binary Search, Min-Max algorithm, Merge Sort, Quick Sort & Randomized Quick Sort, Max/Min Heap & Heap Sort, Order Statistics, Median order, Selection in Expected & Worst-Case Linear Time. |
| `6.3` | `ASoE0603` | Dynamic programming | DP vs Greedy vs Recursion, Elements of DP, Matrix Chain Multiplication, String Editing (Edit Distance), Knapsack problem, Floyd-Warshall All-Pairs Shortest Path, Travelling Salesman Problem (TSP), Memoization Strategy. |
| `6.4` | `ASoE0604` | Loading, linker and macro processor | Basic Loader, Absolute loader, Bootstrap Loader, Machine-Dependent/Independent loader features, Relocation, Program Linking, Linking loader data structures, Automatic library search, Linkage Editors, Dynamic linking, MSDOS & SunOS linkers. |
| `6.5` | `ASoE0605` | Macro processor basic | Macro Definition and Expansion, Macro Processor Algorithm & Data Structures, Machine-Independent features, Parameter Concatenation, Unique labels, Conditional & Recursive Macro Expansion, Keyword Parameters, MASM & ANSI C Macro processors. |
| `6.6` | `ASoE0606` | Network Programming | TCP, IP, UDP, SCTP comparisons & state transition diagrams, UNIX & Winsock Sockets, Socket Address Structures, Byte ordering, Socket System Calls, Concurrent Servers, I/O models (blocking, non-blocking, multiplexing, signal-driven, async), Winsock Architecture/DLL. |

---

### Chapter 7: Artificial Intelligence and Neural Networks (`ACtE09`) — *Engineering Practice*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `7.1` | `ACtE0901` | Introduction to AI and intelligent agent | AI Concepts, Perspectives, History, Applications, Foundations, Intelligent Agents, PEAS description, Agent Types (Simple Reflexive, Model-Based, Goal-Based, Utility-Based), Environment Types (Deterministic/Stochastic, Static/Dynamic, Observable, Single/Multi-Agent). |
| `7.2` | `ACtE0902` | Problem solving and searching techniques | State space search, Problem formulation, CSP, Uninformed search (DFS, BFS, DLS, IDS, Bidirectional), Informed search (Greedy Best-First, A*, Hill Climbing, Simulated Annealing), Adversarial search, Minimax, Alpha-Beta Pruning. |
| `7.3` | `ACtE0903` | Knowledge representation | Mappings, Semantic Nets, Frames, Propositional Logic (Syntax, Semantics, Connectives, Tautology, Validity, WFF, Resolution), Predicate Logic (FOPL, Quantification, Unification, Resolution Refutation), Bayes' Rule, Bayesian/Belief Networks. |
| `7.4` | `ACtE0904` | Expert system and natural language processing | Expert System Architecture, Knowledge acquisition, Declarative vs Procedural knowledge, NLP Terminology, NLU & NLG, NLP Steps/Applications/Challenges, Machine Vision Concepts & Stages, Robotics. |
| `7.5` | `ACtE0905` | Machine learning | Supervised, Unsupervised, Reinforcement Learning, Decision Trees, Naive Bayes Model, Fuzzy learning & Fuzzy Inference Systems, Genetic Algorithms (Operators, Encoding, Selection, Fitness function, Parameters). |
| `7.6` | `ACtE0906` | Neural networks | Biological vs Artificial Neural Networks (ANN), McCulloch-Pitts Neuron, Mathematical Model, Activation functions, ANN Architectures, Perceptron, Learning Rate, Gradient Descent, Delta Rule, Hebbian learning, Adaline, MLP, Backpropagation, Hopfield Network. |

---

### Chapter 8: Java Programming and Web Technology (`ASoE08`) — *Engineering Practice*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `8.1` | `ASoE0801` | Java basics and multithreading | JVM, JRE, JDK, Java OOP, Multithreading (`Thread`, `Runnable`), Priorities, Synchronization, Deadlock, Inter-thread communication, Java Collections, String Handling, `Calendar`, `SimpleDateFormat`, Formatting, `Random`. |
| `8.2` | `ASoE0802` | Java swing, AWT, event handling and JDBC | AWT classes & controls, Layout managers, Event handling & Listener interfaces, Mouse/Keyboard/Action events, Swing origins/features, MVC connection, Swing Components and containers. |
| `8.3` | `ASoE0803` | J2EE, servlet programming and JSP programming | Core J2EE Technologies, Enterprise Architecture, Application Servers, HTTP GET/POST, Web Container, Servlet lifecycle & `web.xml` Deployment Descriptor, Session Management, Request dispatching, JSP Basics, JavaBeans in JSP. |
| `8.4` | `ASoE0804` | Introduction to web technology | History, Client-Server Architecture, HTML5, CSS3, Responsive design, Browser compatibility, XML, DTD, XSLT, XHTML, Cryptography, Authentication, Encryption/Decryption, Digital Certificates & Signatures, SSL, VPN. |
| `8.5` | `ASoE0805` | Client and server-side scripting | JavaScript (Operators, Control, DOM, Array, Object, Smart Form, Classes), jQuery (selectors, events, animations), PHP (Syntax, Arrays, Functions, Strings, Regex, Exceptions, OOP, Sessions, DB CRUD, Files, Email, CMS intro). |
| `8.6` | `ASoE0806` | JDBC | JDBC Basics, Database Drivers (Types 1–4), JDBC API, `Statement` / `PreparedStatement` / `CallableStatement`, `ResultSet`, Metadata, CRUD operations. |

---

### Chapter 9: Real Time Systems, Distributed Systems, Cloud Computing (`ASoE09`) — *Engineering Practice*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `9.1` | `ASoE0901` | Introduction to real time system and real time scheduling | Digital/High-Level Control, Signal Processing, Release Times, Deadlines, Hard vs Soft RT, Periodic Task Model, Precedence Constraints, Clock-Driven, Weighted Round Robin, Priority-Driven, EDF, LST, Rate Monotonic (RMA), Offline vs Online, Aperiodic/Sporadic scheduling. |
| `9.2` | `ASoE0902` | Resources sharing and real time communication | Resource Contention & RAC, Non-preemptive Critical Sections, Priority-Inheritance, Priority-Ceiling, Stack-Based & Preemption Ceiling Protocols, Soft/Hard RT Communication, Priority/WRR Switched Networks, MAC for Broadcast, Resource Reservation Protocols. |
| `9.3` | `ASoE0903` | Introduction to distributed systems and cloud computing | Distributed System Characteristics, Pros/Cons, Models, Resource Sharing, Grid/Cluster/Cloud; Cloud Computing Roots, Desired Features, Challenges, Risks, Benefits & Disadvantages. |
| `9.4` | `ASoE0904` | Distributed file system and CORBA | Inter-object communication, RPC, Events & Notifications, DFS Architecture, Sun NFS, Name Services & DNS, Directory/Discovery Services, Heterogeneity, Middleware, Distributed Objects, CORBA approach & services. |
| `9.5` | `ASoE0905` | Virtualization, cloud architecture, services and storage and cloud security | Load Balancing, Hypervisors, 7 Layers & Types of Virtualization (Server, Desktop, App), Cloud Reference Architecture, Public/Private/Hybrid Clouds, IaaS/PaaS/SaaS, Cloud Storage, Inter-Cloud Management, Provisioning, Cloud/Data/App/VM/Infrastructure Security & Privacy. |
| `9.6` | `ASoE0906` | Agreement in distributed system | Clock synchronization (logical & physical), Distributed mutual exclusion (centralized, distributed, token-based), Fault-tolerant systems, Replication and its types. |

---

### Chapter 10: Project Planning, Design and Implementation (`AALL10`) — *Project Planning & Management*
| Section | Code | Title | Key Syllabus Topics |
| :--- | :--- | :--- | :--- |
| `10.1` | `AALL1001` | Engineering drawings and its concepts | Standard drawing sheets, dimensions, scale, line diagram, orthographic projection, isometric projection/view, pictorial views, sectional drawing. |
| `10.2` | `AALL1002` | Engineering Economics | Project cash flow, discount rate, interest, time value of money; Discounted Payback Period, NPV, IRR, MARR; comparison of alternatives, depreciation system and taxation system in Nepal. |
| `10.3` | `AALL1003` | Project planning and scheduling | Project classifications, project life cycle phases, planning process, scheduling (Bar/Gantt chart, CPM, PERT), resource levelling and smoothing, monitoring/evaluation/controlling. |
| `10.4` | `AALL1004` | Project management | Information system, project risk analysis and management, project financing, tender and its process, contract management. |
| `10.5` | `AALL1005` | Engineering professional practice | Environment and society, professional ethics, regulatory environment, contemporary engineering issues, occupational health and safety (OHS), roles/responsibilities of Nepal Engineers Association (NEA). |
| `10.6` | `AALL1006` | Engineering Regulatory Body | Nepal Engineering Council (NEC Acts & Regulations). |

---

## Part B: Reference Excel Schema (`NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx`)

Inspection of `NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx` establishes the canonical workbook layout:

### 1. Sheets Inside Workbook
- **`Summary`** (Metadata & Syllabus Overview Sheet):
  - `A1`: `"NEC Licence Exam - Software Engineering (ASoE) - Chapter 1: Fundamentals of IT"`
  - `A3:E3`: `Section | Topic | Questions | Attempted | Score`
  - `A4:E9`: Lists sections `1.1` through `1.6` (`30` questions each, `180` total).
- **Section Sheets (`1.1`, `1.2`, `1.3`, `1.4`, `1.5`, `1.6`)**:
  - Named directly after the NEC Syllabus section number (`X.Y`, e.g., `1.1`, `2.4`, `10.6`).
  - **Row 1 (Banner Row)**: e.g., `"Chapter 1 - Section 1.1 Introduction to Information Technology  (type A/B/C/D in the yellow column)"`
  - **Row 2 (Column Header Row)**:

| Column | Header Text | Data Type | Example (`1.1` Row 3) | Used by Web App? |
| :--- | :--- | :--- | :--- | :--- |
| **`A`** | `No` | Integer / String | `1` | Yes — Question index within section |
| **`B`** | `Question` | String | `Who is regarded as the "Father of the Computer"?` | **Yes — Prompt text** |
| **`C`** | `A` | String | `John von Neumann` | **Yes — Option A** |
| **`D`** | `B` | String | `Blaise Pascal` | **Yes — Option B** |
| **`E`** | `C` | String | `Alan Turing` | **Yes — Option C** |
| **`F`** | `D` | String | `Charles Babbage` | **Yes — Option D** |
| **`G`** | `Your Answer` | Empty / Formula | `""` | Ignored on import (Excel self-test cell) |
| **`H`** | `Result` | Empty / Formula | `""` | Ignored on import (Excel formula cell) |
| **`I`** | `Correct` | Enum (`A`\|`B`\|`C`\|`D`) | `D` | **Yes — Authoritative Correct Option** |
| **`J`** | `Reason / Explanation` | String | `Babbage designed the Analytical Engine (1830s)...` | **Yes — Displayed immediately after user locks an answer** |

### 2. Multi-Format Compatibility Rules
To ensure the uploader works seamlessly across **all future Excel files** (Chapters 1–10 or custom user spreadsheets), the parser will support:
1. **NEC Multi-Sheet Format (Primary)**: Sheet names matching `^\d{1,2}\.\d{1,2}$` (e.g., `1.1`, `4.5`, `10.2`) or containing section prefixes (`Section 2.1`, `Ch1_1.1`), automatically inferring `chapterNumber` (`1`–`10`), `sectionId` (`1.1`–`10.6`), and `syllabusCode` (`ASoE0101`–`AALL1006`).
2. **Dynamic Header Row Detection**: Scans the first 10 rows of every worksheet to locate the row containing `Question` + options (`A`/`Option A`, `B`/`Option B`, etc.) + `Correct`/`Answer` — handling Row-1 title banners automatically.
3. **Single-Sheet / Custom Excel Fallback**: If a workbook has a single sheet (e.g., `Sheet1` or `Questions`), reads optional `Chapter` / `Section` columns or lets the user assign a target Chapter/Section during upload.

