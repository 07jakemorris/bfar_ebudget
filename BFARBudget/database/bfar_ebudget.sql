-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 08, 2026 at 04:15 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bfar_ebudget`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_code`
--

CREATE TABLE `account_code` (
  `id` int(11) NOT NULL,
  `expense_type_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `account_code`
--

INSERT INTO `account_code` (`id`, `expense_type_id`, `code`, `description`, `is_active`) VALUES
(1, 9, '50101010-01', 'Basic Salary - Civilian', 1),
(2, 9, '50101020-00', 'Salaries and Wages - Casual/ Contractual', 1),
(3, 15, '50102010-01', 'Personnel Economic Relief Allowance - Civilian', 1),
(4, 15, '50102020-00', 'Representation Allowance', 1),
(5, 15, '50102030-01', 'Transportation Allowance', 1),
(6, 15, '50102040-01', 'Clothing/ Uniform Allowance - Civilian', 1),
(7, 15, '50102050-00', 'Subsistence  Allowance', 1),
(8, 15, '50102060-00', 'Laundry Allowance', 1),
(9, 15, '50102070-00', 'Quarters Allowance', 1),
(10, 15, '50102080-01', 'Productivity Incentive Allowance - Civilian', 1),
(11, 15, '50102090-01', 'Overseas Allowance - Civilian', 1),
(12, 15, '50102100-00', 'Honoraria', 1),
(14, 15, '50102120-00', '\"Longevity  Pay\"', 1),
(15, 15, '50102130-00', 'Overtime and Night Pay', 1),
(16, 15, '50102140-01', 'Year End Bonus - Civilian', 1),
(17, 15, '50102160-01', 'Mid Year Bonus - Civilian', 1),
(18, 15, '50102150-01', 'Cash Gift - Civilian', 1),
(27, 15, '50102110-00', 'Other Bonuses and Allowances', 1),
(36, 16, '50103020-01', 'PAG-IBIG Contributions - Civilian', 1),
(37, 16, '50103030-01', 'PhilHealth Contributions - Civilian', 1),
(38, 16, '50103040-01', 'Employees Compensation Insurance Premiums - Civilian', 1),
(39, 17, '50104990-01', 'Lump-sum for Creation of New Positions - Civilian', 1),
(40, 17, '50104990-10', 'Lump-sum for Step Increment - Length of Service', 1),
(41, 17, '50104990-11', 'Lump-sum for Step Increment - Meritorious Performance', 1),
(42, 17, '50104990-15', 'Loyalty Award - Civilian', 1),
(43, 17, '50104990-99', 'Other Personnel Benefits', 1),
(44, 17, '50104010-01', 'Pension Benefits - Civilian', 1),
(45, 17, '50104020-01', 'Retirement Gratuity - Civilian', 1),
(46, 17, '50104030-01', 'Terminal Leave Benefits - Civilian', 1),
(47, 18, '50201010-00', 'Travelling Expenses - Local', 1),
(48, 18, '50201020-00', 'Travelling Expenses - Foreign', 1),
(49, 19, '50202010-00', 'Training Expenses', 1),
(50, 19, '50202020-00', 'Scholarship Grants/ Expenses', 1),
(51, 20, '50203010-00', 'Office Supplies Expenses', 1),
(52, 20, '50203020-00', 'Accountable Forms Expenses', 1),
(53, 20, '50203030-00', 'Non-Accountable Forms Expenses', 1),
(54, 20, '50203040-00', 'Animal/ Zoological Supplies Expenses', 1),
(55, 20, '50203050-00', 'Food Supplies Expenses', 1),
(56, 20, '50203070-00', 'Drugs and Medicines Expenses', 1),
(57, 20, '50203080-00', 'Medical, Dental and Laboratory Supplies Expenses', 1),
(58, 20, '50203090-00', 'Fuel, Oil and Lubricants Expenses', 1),
(59, 20, '50203100-00', 'Agricultural and Marine Supplies Expenses', 1),
(60, 20, '50203110-01', 'Textbooks and Instructional Materials Expenses', 1),
(61, 20, '50203130-00', 'Chemical and Filtering Supplies Expenses', 1),
(62, 20, '50203210-00', '\"Semi-Expendable Machineries  and Equipment Expenses\"', 1),
(63, 20, '50203220-00', '\"Semi-Expendable Furniture, Fixtures and Book Expenses\"', 1),
(64, 20, '50203990-00', 'Other Supplies and Materials Expenses', 1),
(68, 21, '50204010-00', 'Water Expenses', 1),
(69, 21, '50204020-00', 'Electricity Expenses', 1),
(71, 21, '50204030-00', 'Gas/Heating Expenses', 1),
(72, 21, '50204990-00', 'Other Utility Expenses', 1),
(73, 4, '50205010-00', 'Postage and Courier Services', 1),
(74, 4, '50205020-00', 'Telephone Expenses', 1),
(75, 4, '50205030-00', 'Internet Subscription Expenses', 1),
(76, 4, '50205040-00', 'Cable, Satellite, Telegraph and Radio Expenses', 1),
(77, 22, '50206010-00', 'Awards/ Rewards Expenses', 1),
(78, 22, '50206020-00', 'Prizes', 1),
(79, 22, '50206030-00', 'Indemnities', 1),
(80, 23, '50207010-00', 'Survey Expenses', 1),
(81, 23, '50207020-00', 'Research, Exploration and Development Expenses', 1),
(82, 24, '50208010-00', 'Demolition and Relocation Expenses', 1),
(83, 24, '50208020-00', 'Desilting, Drilling and Dredging Expenses', 1),
(84, 25, '50209010-01', 'ICT Generation, Transmission and Distribution Expenses', 1),
(85, 25, '50209010-02', 'Generation, Transmission and Distribution Expenses', 1),
(86, 26, '50210010-00', 'Confidential Expenses', 1),
(87, 26, '50210020-00', 'Intelligence Expenses', 1),
(88, 26, '50210030-00', 'Extraordinary and Miscellaneous Expenses', 1),
(89, 27, '50211010-00', 'Legal Services', 1),
(90, 27, '50211020-00', 'Auditing Services', 1),
(91, 27, '50211030-00', 'Consultancy Services', 1),
(92, 27, '50211990-00', 'Other Professional Services', 1),
(93, 28, '50212010-00', 'Environment /Sanitary Services', 1),
(94, 28, '50212020-00', 'Janitorial Services', 1),
(95, 28, '50212030-00', 'Security Services', 1),
(96, 28, '50212990-00', 'Other  General Services', 1),
(97, 5, '50213010-00', 'Investment Property', 1),
(98, 5, '50213020-00', 'Land Improvements', 1),
(99, 5, '50213030-00', 'Infrastructure Assets', 1),
(100, 5, '50213040-00', 'Building and Other Structures', 1),
(101, 5, '50213050-00', 'Machinery and Equipment', 1),
(102, 5, '50213060-00', 'Transportation Equipment', 1),
(103, 5, '50213070-00', 'Furniture and Fixtures', 1),
(104, 5, '50213080-00', 'Leased Assets', 1),
(105, 5, '50213090-00', 'Leased Assets Improvement', 1),
(107, 5, '50213210-00', 'Semi-Expendable Machineries and Equipment Expenses', 1),
(108, 5, '50213220-00', 'Semi-Expendable Furniture, Fixtures and Book Expenses', 1),
(109, 5, '50213980-00', 'Others', 1),
(110, 5, '50213990-00', 'Other Property, Plant and Equipment', 1),
(111, 29, '50214010-00', 'Subsidy to NGAs', 1),
(112, 29, '50214020-00', 'Financial Assistance to NGAs', 1),
(113, 29, '50214030-00', 'Financial Assistance to LGUs', 1),
(114, 29, '50214040-00', 'Budgetary Support to GOCCs', 1),
(115, 29, '50214050-00', 'Financial Assistance to NGOs/Pos', 1),
(116, 29, '50214070-00', 'Subsidies to Regional Offices/Staff Bureaus', 1),
(117, 29, '50214080-00', 'Subsidies to Operating Units', 1),
(120, 29, '50214990-00', 'Subsidies - Others', 1),
(121, 30, '50215010-00', 'Taxes, Duties and Licenses', 1),
(122, 30, '50215020-00', 'Fidelity Bond Premiums', 1),
(123, 30, '50215030-00', 'Insurance Expenses', 1),
(124, 31, '50216010-00', 'Labor and Wages', 1),
(125, 8, '50299010-00', 'Advertising, Promotional and Marketing Expenses', 1),
(126, 8, '50299020-00', 'Printing and Publication Expenses', 1),
(127, 8, '50299030-00', 'Representation Expenses', 1),
(128, 8, '50299040-00', 'Transportation and Delivery Expenses', 1),
(129, 8, '50299050-00', 'Rent/Lease Expenses', 1),
(130, 8, '50299060-00', 'Membership Dues and Contributions to Organizations', 1),
(131, 8, '50299070-00', 'Subscription Expenses', 1),
(132, 8, '50299080-00', 'Donations', 1),
(133, 8, '50299090-00', 'Litigation/ Acquired Assets Expenses', 1),
(134, 8, '50299100-00', 'Loss on Guaranty', 1),
(135, 8, '50299210-00', 'Legal Defense Expense', 1),
(136, 8, '50299220-00', 'Bank Transaction Fee', 1),
(137, 8, '50299990-00', 'Other Maintenance and Operating Expenses', 1),
(138, 32, '50604020-00', 'Land Improvement Outlays', 1),
(139, 32, '50604030-00', 'Infrastructure Outlays', 1),
(140, 32, '50604040-00', 'Building and Other Structures Outlay', 1),
(141, 32, '50604050-00', 'Machinery and Equipment', 1),
(142, 32, '50604060-00', 'Transportation Equipment Outlay', 1),
(143, 32, '50604070-00', 'Furniture, Fixtures and Books Outlay', 1),
(144, 32, '50604090-99', 'Other Property, Plant and Equipments', 1),
(145, 33, '50605010-00', 'Bearer Biological Assets Outlays', 1),
(146, 33, '50605020-00', 'Consumable Biological Assets Outlay', 1),
(147, 34, '50606010-01', 'Patents/Copyright', 1),
(148, 34, '50606010-02', 'Computer Software', 1),
(149, 34, '50606010-99', 'Other Intangible Assets', 1);

-- --------------------------------------------------------

--
-- Table structure for table `activity_level`
--

CREATE TABLE `activity_level` (
  `id` int(11) NOT NULL,
  `project_sub_category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_level`
--

INSERT INTO `activity_level` (`id`, `project_sub_category_id`, `name`, `is_active`) VALUES
(1, 1, '3-1-01-05-2-00001-000-01 - Program Management', 1),
(2, 2, '3-1-01-01-1-00001-001 Payao', 1),
(3, 2, '3-1-01-01-1-00001-002 Hook and Line Gears', 1),
(4, 2, '3-1-01-01-1-00001-003 Net Gears', 1),
(5, 2, '3-1-01-01-1-00001-004 Motorized Boat', 1),
(6, 2, '3-1-01-01-1-00001-000-21 Others', 1),
(7, 3, '3-1-01-02-1-00001-001 Milkfish broodstocks maintained (pcs)', 1),
(8, 3, '3-1-01-02-1-00001-001 Others broodstocks maintained (pcs)', 1),
(9, 3, '3-1-01-02-1-00001-001 Tilapia broodstocks distributed (pcs)', 1),
(10, 3, '3-1-01-02-1-00001-001 Tilapia broodstocks maintained (pcs)', 1),
(11, 3, '3-1-01-02-1-00001-002 Milkfish fingerlings/seed stocks distributed (in M)', 1),
(12, 3, '3-1-01-02-1-00001-002 Milkfish FRY/seed stocks produced (in M)', 1),
(13, 3, '3-1-01-02-1-00001-002 Others fingerlings/seed stocks distributed (in M)', 1),
(14, 3, '3-1-01-02-1-00001-002 Others FRY/seed stocks produced (in M)', 1),
(15, 3, '3-1-01-02-1-00001-002 Tilapia fingerlings/seed stocks distributed (in M)', 1),
(16, 3, '3-1-01-02-1-00001-002-01 Tilapia  fingerlings/seed stocks produced (in M)', 1),
(17, 3, '3-1-01-02-1-00001-002-02 Milkfish  fingerlings/seed stocks procured (in M)', 1),
(18, 3, '3-1-01-02-1-00001-002-02 Milkfish  fingerlings/seed stocks produced (in M)', 1),
(19, 3, '3-1-01-02-1-00001-003 Number of seaweed farm implements distributed', 1),
(20, 3, '3-1-01-02-1-00001-004 Number of seaweed nurseries established', 1),
(21, 3, '3-1-01-02-1-00001-005 Number of seaweed nurseries maintained', 1),
(22, 3, '3-1-01-02-1-00001-006 Number of seaweed culture laboratory maintained', 1),
(23, 3, '3-1-01-02-1-00001-007 Number of mariculture parks established/maintained/expanded', 1),
(24, 3, '3-1-01-02-1-00001-008  Number of cages for livelihood distributed', 1),
(25, 3, '3-1-01-02-1-00001-009 Number of Environmental Monitoring Conducted', 1),
(26, 4, '3-1-01-02-1-00002-001 Number of Technology Stations operated/maintained', 1),
(27, 4, '3-1-01-02-1-00002-002 Number of hatcheries established/maintained', 1),
(28, 5, '3-1-01-03-1-00001-004 Dryers', 1),
(29, 5, '3-1-01-03-1-00001-005 Vacuum sealer/packer', 1),
(30, 5, '3-1-01-03-1-00001-001 Others', 1),
(31, 6, '3-1-01-04-1-00001-001 Number of Business/ market/credit facilitation', 1),
(32, 6, '3-1-01-04-1-00001-001 Number of market monitoring conducted', 1),
(33, 6, '3-1-01-04-1-00001-002 Number of Agri-aqua fair/exhibit participated', 1),
(34, 1, '3-1-01-05-2-00001-000-01 - Marketing Assistance and Enterprise Development', 1),
(35, 1, '3-1-01-05-2-00001-000-01 - Number of Livelihood Projects distributed', 1),
(36, 1, '3-1-01-05-2-00001-000-01 - Social Preparation', 1),
(37, 7, '3-1-01-05-2-00001-200-01- Capacity Building', 1),
(38, 7, '3-1-01-05-2-00001-200-01- Number of Livelihood Projects distributed', 1),
(39, 7, '3-1-01-05-2-00001-200-01- Program Management', 1),
(40, 8, '3-1-01-02-1-00001-005 Number of seaweed nurseries maintained', 1),
(41, 8, '3-1-01-02-1-00001-006 Number of seaweed culture laboratory maintained', 1),
(42, 9, '310105200013 - Fuel Assistance to the Fisherfolk', 1),
(43, 10, '3-1-02-00-1-00004-000-01 Number of fisheries sanctuaries/reserve/refuge assess', 1),
(44, 10, '3-1-02-00-1-00004-000-01 Number of LGU assisted', 1),
(45, 10, '3-1-02-00-1-00004-000-01 Number of SAG established  and operational', 1),
(46, 10, '3-1-02-00-1-00004-000-02 Number of Management Areas Enhanced', 1),
(47, 12, '3-1-02-00-1-00001-001 Established to Maintained (MCS Center/Stations)', 1),
(48, 12, '3-1-02-00-1-00001-001 Number of  Vessels Monitoring System operated', 1),
(49, 12, '3-1-02-00-1-00001-001 Number of fishing vessels tracked/monitored', 1),
(50, 12, '3-1-02-00-1-00001-001 Number of FRPG operations conducted - Land-based', 1),
(51, 12, '3-1-02-00-1-00001-001 Number of FRPG operations conducted - Sea-borne', 1),
(52, 12, '3-1-02-00-1-00001-001 Number of MCS and Patrol Vessels operated', 1),
(53, 12, '3-1-02-00-1-00001-002 Number of Harmful Algal Bloom (HAB) laboratories maintained', 1),
(54, 12, '3-1-02-00-1-00001-002 Number of Harmful Algal Bloom (HAB) monitoring conducted', 1),
(55, 13, '3-1-02-00-1-00002-001 Number of disease sampling, detection, and analysis conducted Facilities', 1),
(56, 13, '3-1-02-00-1-00002-001 Number of facility monitoring conducted', 1),
(57, 13, '3-1-02-00-1-00002-001 Number of Laboratories maintained/operated Facilities', 1),
(58, 13, '3-1-02-00-1-00002-002 Number of analysis conducted Products', 1),
(59, 13, '3-1-02-00-1-00002-002 Number of fishery products monitoring conducted Products', 1),
(61, 13, '3-1-02-00-1-00002-002 Number of laboratories maintained/operated Products', 1),
(62, 14, '3-1-02-00-1-00003-001 commercial fishing vessels and gears (Inspection Conducted)', 1),
(63, 14, '3-1-02-00-1-00003-001 commercial fishing vessels and gears (Permit Issuance)', 1),
(64, 14, '3-1-02-00-1-00003-001 fish and fisheries products (Permit Issuance)', 1),
(65, 14, '3-1-02-00-1-00003-001 FLA and Aquasilviculture covered areas (Inspection Conducted)', 1),
(66, 14, '3-1-02-00-1-00003-001-01 fish and fisheries products (Inspection Conducted)', 1),
(67, 15, 'COMPONENT 3: Support to Project Implementation and Management', 1),
(68, 15, 'Sub-component 1.1: Ecosystem Approach to Fisheries Management Planning and Institutions', 1),
(69, 15, 'Sub-component 1.2: Aquaculture Development and Management', 1),
(70, 15, 'Sub-component 1.3: Strengthening Management of Coastal Resources in Municipal Waters', 1),
(71, 15, 'Sub-component 2.1: Fishers\' Livelihood Diversification and Development', 1),
(72, 15, 'Sub-component 2.2: Aquaculture Fisheries and Enterprise Development', 1),
(73, 15, 'Sub-component 2.3: Aquaculture Fisheries Infrastructure', 1),
(74, 22, '3-1-02-00-1-00003-001 fish and fisheries products (Permit Issuance)', 1),
(75, 22, '3-1-03-00-1-00001-001 Operation of Regional Fisheries Training Centers and Asian Fisheries Academy', 1),
(76, 22, '3-1-03-00-1-00001-001-01 Number of trainings conducted Aquaculture', 1),
(77, 22, '3-1-03-00-1-00001-001-01 Number of trainings conducted Municipal', 1),
(78, 22, '3-1-03-00-1-00001-001-01 Number of trainings conducted Others', 1),
(79, 22, '3-1-03-00-1-00001-001-01 Number of trainings conducted Post Harvest', 1),
(80, 22, '3-1-03-00-1-00001-001-01 Number of trainings conducted Regulatory', 1),
(81, 22, '3-1-03-00-1-00001-001-02 Number of technical assistance provided Aquaculture', 1),
(82, 22, '3-1-03-00-1-00001-001-02 Number of technical assistance provided Municipal', 1),
(83, 22, '3-1-03-00-1-00001-001-02 Number of technical assistance provided Others', 1),
(84, 22, '3-1-03-00-1-00001-001-02 Number of technical assistance provided Post Harvest', 1),
(85, 22, '3-1-03-00-1-00001-001-02 Number of technical assistance provided Regulatory', 1),
(86, 22, '3-1-03-00-1-00001-002-01 Number of technology demonstrations established Aquaculture', 1),
(87, 22, '3-1-03-00-1-00001-003-01 Number of IEC activities conducted', 1),
(88, 22, '3-1-03-00-1-00001-003-01 Number of IEC materials developed/produced', 1),
(89, 22, '3-1-03-00-1-00001-004-01 No. of fisherfolk Children provided with scholarship', 1),
(90, 22, '3-1-03-00-1-00001-004-01 No. of Fisherfolk Operations Center FARMC PMC operated', 1),
(91, 22, '3-1-03-00-1-00001-004-01 No. of LGU Technicians assisted', 1),
(92, 22, '3-1-03-00-1-00001-004-02 Number of FARMCs strengthened', 1),
(93, 23, '3-1-03-00-1-00001-004-02 Number of FARMCs strengthened', 1),
(94, 23, '3-1-04-00-1-00001-001 Policy formulation/recommendation', 1),
(95, 24, '1-0-00-00-1-00001-001 Operation of BFAR Central and Regional Offices', 1),
(96, 24, '1-0-00-00-1-00001-002 Operation of BFAR Provincial/City Fishery Offices', 1),
(97, 24, '1-0-00-00-1-00001-003 Operation of BFAR Quarantine Stations', 1),
(98, 25, '2-0-00-00-1-00001-002-01 Number of Local consultations/ Workshops/ Meetings conducted', 1),
(99, 25, '2-0-00-00-1-00001-002-02 Number of Local consultations/ Workshops/ Meetings attended', 1),
(100, 25, '2-0-00-00-1-00001-002-04 FIMC Operated (National/Regional)', 1),
(101, 25, '2-0-00-00-1-00001-002-04 Systems Developed/maintained', 1),
(102, 25, '2-0-00-00-1-00001-003-01  Number of Field visits conducted', 1),
(103, 25, '2-0-00-00-1-00001-003-02 Number of agency reports prepared and submitted (monthly/ Quarterly/ Annual', 1),
(104, 26, '2-0-00-00-1-00001-002-00 Number Fishery cased resolved/settled', 1),
(105, 26, '2-0-00-00-1-00003-001 Number of Legal and advisory services rendered', 1);

-- --------------------------------------------------------

--
-- Table structure for table `allotments`
--

CREATE TABLE `allotments` (
  `id` int(11) NOT NULL,
  `rc_id` int(11) NOT NULL,
  `fund_id` int(11) NOT NULL,
  `expense_class_id` int(11) NOT NULL,
  `account_code_id` int(11) DEFAULT NULL,
  `fiscal_year` varchar(4) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `allotments`
--

INSERT INTO `allotments` (`id`, `rc_id`, `fund_id`, `expense_class_id`, `account_code_id`, `fiscal_year`, `amount`, `created_at`, `updated_at`) VALUES
(1, 15, 1, 2, 47, '2026', 25000.00, '2026-06-30 10:14:07', '2026-06-30 10:14:07'),
(2, 42, 1, 2, 74, '2026', 24000.00, '2026-07-02 16:19:56', '2026-07-02 16:19:56'),
(3, 43, 1, 2, 74, '2026', 24000.00, '2026-07-02 16:19:56', '2026-07-02 16:19:56'),
(4, 44, 1, 2, 74, '2026', 24000.00, '2026-07-02 16:19:56', '2026-07-02 16:19:56'),
(5, 45, 1, 2, 74, '2026', 24000.00, '2026-07-02 16:19:56', '2026-07-02 16:19:56'),
(6, 46, 1, 2, 74, '2026', 24000.00, '2026-07-02 16:19:56', '2026-07-02 16:19:56'),
(7, 17, 1, 2, 59, '2026', 150000.00, '2026-07-02 16:26:54', '2026-07-02 16:26:54'),
(8, 16, 1, 2, 59, '2026', 150000.00, '2026-07-02 16:27:42', '2026-07-02 16:27:42');

-- --------------------------------------------------------

--
-- Table structure for table `earmarks`
--

CREATE TABLE `earmarks` (
  `id` int(11) NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `earmarked_date` date NOT NULL,
  `payee` varchar(200) NOT NULL,
  `creditor_type` enum('Internal','External') NOT NULL DEFAULT 'Internal',
  `quarter` enum('Q1','Q2','Q3','Q4') NOT NULL,
  `rc_id` int(11) NOT NULL,
  `signatory_id` int(11) NOT NULL,
  `purpose` text NOT NULL,
  `activity_level_id` int(11) NOT NULL,
  `account_code_id` int(11) NOT NULL,
  `sub_account_code_id` int(11) DEFAULT NULL,
  `fund_id` int(11) DEFAULT NULL,
  `fund_cluster` varchar(100) DEFAULT NULL,
  `financing_source` varchar(150) DEFAULT NULL,
  `authorization_code` varchar(150) DEFAULT NULL,
  `fund_category` varchar(200) DEFAULT NULL,
  `full_funding_source` varchar(50) DEFAULT NULL,
  `department_code` varchar(100) NOT NULL,
  `agency_code` varchar(100) NOT NULL,
  `operating_unit` varchar(100) NOT NULL,
  `lower_level_unit` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `status` enum('Pending','Released','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `earmarks`
--

INSERT INTO `earmarks` (`id`, `pr_no`, `earmarked_date`, `payee`, `creditor_type`, `quarter`, `rc_id`, `signatory_id`, `purpose`, `activity_level_id`, `account_code_id`, `sub_account_code_id`, `fund_id`, `fund_cluster`, `financing_source`, `authorization_code`, `fund_category`, `full_funding_source`, `department_code`, `agency_code`, `operating_unit`, `lower_level_unit`, `amount`, `remarks`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(2, '26-06-1021', '2026-06-23', 'EDV Trading', 'External', 'Q2', 1, 1, 'Office supplies', 1, 51, NULL, 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '', '', '', '', 12000.00, 'For payment of procurement', 'Released', 'system', '2026-06-23 11:50:32', '2026-06-23 11:50:44'),
(3, '26-07-0650', '2026-07-02', '', 'Internal', 'Q1', 4, 2, 'Procurement of office supplies and materials', 43, 51, 25, 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '05-000-00-00000 - Department of Agriculture', '05-003-00-00000 - Bureau of Fisheries and Aquatic Resources', '05-003-03-00000 - Regional Offices', '05-003-03-00008 - Region VIII', 17500.00, NULL, 'Pending', 'system', '2026-07-02 10:16:00', '2026-07-02 10:16:00');

-- --------------------------------------------------------

--
-- Table structure for table `expense_class`
--

CREATE TABLE `expense_class` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_class`
--

INSERT INTO `expense_class` (`id`, `code`, `name`, `is_active`) VALUES
(1, 'PS', 'Personnel Services', 1),
(2, 'MOOE', 'Maintenance & Other Operating Expenses', 1),
(6, 'CO', 'Capital Outlay', 1);

-- --------------------------------------------------------

--
-- Table structure for table `expense_type`
--

CREATE TABLE `expense_type` (
  `id` int(11) NOT NULL,
  `expense_class_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_type`
--

INSERT INTO `expense_type` (`id`, `expense_class_id`, `name`, `is_active`) VALUES
(4, 2, 'Communication Expenses', 1),
(5, 2, 'Repair & Maintenance', 1),
(7, 2, 'Fuel, Oil & Lubricants', 1),
(8, 2, 'Other MOOE', 1),
(9, 1, 'Salaries & Wages', 1),
(10, 1, 'Personnel Economic Relief Allowance (PERA)', 1),
(11, 1, 'Representation & Transportation Allowance', 1),
(15, 1, 'Other Compensation', 1),
(16, 1, 'Personnel Benefit Contributions', 1),
(17, 1, 'Other Personnel Benefits', 1),
(18, 2, 'Travelling Expenses', 1),
(19, 2, 'Training and Scholarship Expenses', 1),
(20, 2, 'Supplies and Materials', 1),
(21, 2, 'Utility Expenses', 1),
(22, 2, 'Awards/Rewards & Prizes', 1),
(23, 2, 'Survey, Research, Exploration & Development Expenses', 1),
(24, 2, 'Demolition/Relocation & Desilting/Drilling/Dredging', 1),
(25, 2, 'Generation, Transmission & Distribution Expenses', 1),
(26, 2, 'Confidential, Intelligence & Extraordinary Expenses', 1),
(27, 2, 'Professional Expenses', 1),
(28, 2, 'General Services', 1),
(29, 2, 'Financial Assistance/Subsidy', 1),
(30, 2, 'Taxes, Insurance Premiums and Other Fees', 1),
(31, 2, 'Labor and Wages', 1),
(32, 6, 'Property, Plant & Equipment Outlay', 1),
(33, 6, 'Biological Assets Outlay', 1),
(34, 6, 'Intangible Outlay', 1);

-- --------------------------------------------------------

--
-- Table structure for table `fund`
--

CREATE TABLE `fund` (
  `id` int(11) NOT NULL,
  `fund_cluster` varchar(100) NOT NULL,
  `financing_source` varchar(100) NOT NULL,
  `authorization_code` varchar(100) NOT NULL,
  `fund_category` varchar(150) NOT NULL,
  `full_funding_source` varchar(50) NOT NULL,
  `is_active` tinyint(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fund`
--

INSERT INTO `fund` (`id`, `fund_cluster`, `financing_source`, `authorization_code`, `fund_category`, `full_funding_source`, `is_active`) VALUES
(1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', 1),
(2, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01102000 - Continuing Appropriations', '01102101 - Specific Budget of the Agency (Continuing)', '01102101', 1),
(3, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01104000 - Automatic Appropriations', '01104102 - Retirement and Life Insurance Premiums', '01104102', 1),
(4, '02000000 - Foreign Assisted Fund', '02100000 - General Fund', '02101000 - New General Appropriations', '02101163 - International Bank for Reconstruction and Development (IBRD)', '02101163', 1),
(5, '02000000 - Foreign Assisted Fund', '02100000 - General Fund', '02101000 - New General Appropriations', '02102151 - GOP Counterpart Funds', '02102151', 1),
(6, '02000000 - Foreign Assisted Fund', '02100000 - General Fund', '02102000 - New General Appropriations', '02102163 - International Bank for Reconstruction and Development (IBRD)', '02102163', 1),
(7, '02000000 - Foreign Assisted Fund', '02100000 - General Fund', '02102000 - New General Approriations', '02102163 - Support to Foreign-Assisted Projects', '02102163', 1),
(8, '03000000 - Special Accounts - Locally Funded/Domestic Grants Fund', '01100000 - General Fund', '03102000 - Automatic Appropriations', '03102391 - Special Account - Locally Funded/Domestic Grants Fund, Automatic Appropriations, Fisheries', '03102391', 1);

-- --------------------------------------------------------

--
-- Table structure for table `obligations`
--

CREATE TABLE `obligations` (
  `id` int(11) NOT NULL,
  `ors_no` varchar(30) NOT NULL,
  `ors_date` date NOT NULL,
  `payee` varchar(200) NOT NULL,
  `creditor_type` enum('Internal','External') NOT NULL,
  `quarter` enum('Q1','Q2','Q3','Q4') NOT NULL,
  `rc_id` int(11) NOT NULL,
  `signatory_id` int(11) NOT NULL,
  `particulars` text NOT NULL,
  `fund_id` tinyint(10) NOT NULL,
  `fund_cluster` varchar(100) NOT NULL,
  `financing_source` varchar(100) NOT NULL,
  `authorization_code` varchar(100) NOT NULL,
  `fund_category` varchar(100) NOT NULL,
  `full_funding_source` varchar(50) NOT NULL,
  `department_code` varchar(100) NOT NULL,
  `agency_code` varchar(100) NOT NULL,
  `operating_unit` varchar(100) NOT NULL,
  `lower_level_unit` varchar(100) NOT NULL,
  `activity_level_id` int(11) NOT NULL,
  `account_code_id` int(11) NOT NULL,
  `sub_account_code_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('Pending','Posted','Overdue','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `obligations`
--

INSERT INTO `obligations` (`id`, `ors_no`, `ors_date`, `payee`, `creditor_type`, `quarter`, `rc_id`, `signatory_id`, `particulars`, `fund_id`, `fund_cluster`, `financing_source`, `authorization_code`, `fund_category`, `full_funding_source`, `department_code`, `agency_code`, `operating_unit`, `lower_level_unit`, `activity_level_id`, `account_code_id`, `sub_account_code_id`, `amount`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(2, '26-06-0002', '2026-06-26', 'EDV Trading', 'External', 'Q2', 4, 2, 'To payment office supplies and other materials', 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '', '', '', '', 31, 51, 25, 47000.00, 'Pending', 'system', '2026-06-26 15:35:11', '2026-06-26 15:35:11'),
(3, '26-06-0003', '2026-06-29', 'Tacloban Grace Trading', 'External', 'Q2', 16, 15, 'To payment of agricultural supplies', 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '05-000-00-00000 - Department of Agriculture', '05-003-00-00000 - Bureau of Fisheries and Aquatic Resources', '05-003-03-00000 - Regional Offices', '05-003-03-00008 - Region VIII', 12, 59, NULL, 150000.00, 'Pending', 'system', '2026-06-29 12:12:29', '2026-06-29 12:12:29'),
(4, '26-07-0004', '2026-07-02', 'Loreginia P. Briones', 'Internal', 'Q3', 43, 38, 'Reimbursement of Communication Expenses for the month of January 2026', 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '05-000-00-00000 - Department of Agriculture', '05-003-00-00000 - Bureau of Fisheries and Aquatic Resources', '05-003-03-00000 - Regional Offices', '05-003-03-00008 - Region VIII', 6, 74, 43, 2000.00, 'Pending', 'system', '2026-07-02 16:22:28', '2026-07-02 16:22:28'),
(5, '26-07-0005', '2026-07-06', 'Karleen R. Destura', 'Internal', 'Q3', 15, 14, 'Reimburse TE for the month of May 14 - 15, 2026', 1, '01000000 - Regular Agency Fund', '01100000 - General Fund', '01101000 - New General Appropriations', '01101101 - Specific Budget of the Agency (Current)', '01101101', '05-000-00-00000 - Department of Agriculture', '05-003-00-00000 - Bureau of Fisheries and Aquatic Resources', '05-003-03-00000 - Regional Offices', '05-003-03-00008 - Region VIII', 55, 47, NULL, 14350.00, 'Pending', 'system', '2026-07-06 10:58:42', '2026-07-06 10:58:42');

-- --------------------------------------------------------

--
-- Table structure for table `program`
--

CREATE TABLE `program` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `program`
--

INSERT INTO `program` (`id`, `name`, `is_active`) VALUES
(1, '310100000000 - Fisheries Development Program', 1),
(2, '310200000000 - Fisheries Regulatory and Law Enforcement Program', 1),
(3, '310300000000 - Fisheries Extension Program', 1),
(4, '310400000000 - Fisheries Policy Program', 1),
(5, '1000000000 - General Administration and Support (GAS)', 1),
(6, '2000000000 - Support to Operations (STO)', 1);

-- --------------------------------------------------------

--
-- Table structure for table `project_category`
--

CREATE TABLE `project_category` (
  `id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_category`
--

INSERT INTO `project_category` (`id`, `program_id`, `name`, `is_active`) VALUES
(1, 1, '310105200000 - Locally-Funded Sub-Program', 1),
(2, 1, '310101000000 - Capture Fisheries Sub-Program', 1),
(3, 1, '310102000000 - Aquaculture Sub-Program', 1),
(4, 1, '310103000000 - Post-harvest Sub-Program', 1),
(5, 1, '310104000000 - Market Development Sub-Program', 1),
(6, 2, '310200100000 - Coastal and Inland Fisheries Resource Management', 1),
(7, 2, '310200100001 - Monitoring, Control and Surveillance', 1),
(8, 2, '310200100000 - Quality Control and Inspection', 1),
(9, 2, '310200100000 - Quarantine, Registration & Licensing', 1),
(10, 2, '310200300000 Foreign Assisted Sub-Program', 1),
(11, 3, '310300100000 - Extension, Support, Education and Training Services (ESETS)', 1),
(12, 4, '310400100001 - Formulation, Monitoring and Evaluation of Policies, Plans and Programs', 1);

-- --------------------------------------------------------

--
-- Table structure for table `project_sub_category`
--

CREATE TABLE `project_sub_category` (
  `id` int(11) NOT NULL,
  `project_category_id` int(11) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_sub_category`
--

INSERT INTO `project_sub_category` (`id`, `project_category_id`, `program_id`, `name`, `is_active`) VALUES
(1, 1, 1, '310105200001 - Special Areas for Agricultural Development (SAAD) Program', 1),
(2, 2, 1, '310101100001 - Fishing Gear/Paraphernalia Distribution', 1),
(3, 3, 1, '310102100001 - Fisheries Production and Distribution', 1),
(4, 3, 1, '310102100002 - Operation and management of production facilities', 1),
(5, 4, 1, '310103100001 - Provision of Fishery On-Farm Equipments & Post-Harvest Facilities', 1),
(6, 5, 1, '310104100001 - Market Development Services', 1),
(7, 1, 1, '310105200012000 Development of Salt Industry Project', 1),
(8, 1, 1, '310105200013 - Aquaculture and Mariculture Expansion and Invigoration Project', 1),
(9, 1, 1, '310105200013 - Fuel Assistance to the Fisherfolk', 1),
(10, 6, 2, '310200100004 - Coastal and Inland Fisheries Resource Management', 1),
(12, 7, 2, '310200100001 - Monitoring, Control and Surveillance', 1),
(13, 8, 2, '310200100002 - Quality Control and Inspection', 1),
(14, 9, 2, '310200100003 - Quarantine, Registration & Licensing', 1),
(15, 10, 2, '310200300001 Philippine Fisheries and Coastal Resiliency Project', 1),
(22, 11, 3, '310300100001 - Extension, Support, Education and Training Services (ESETS)', 1),
(23, 12, 4, '310400100001 - Formulation, Monitoring and Evaluation of Policies, Plans and Programs', 1),
(24, NULL, 5, '100000100001 - General Management and Supervision', 1),
(25, NULL, 6, '200000100001 - Development of Organizational Policies, Plans & Procedures', 1),
(26, NULL, 6, '200000100003 - Legal and Advisory Services', 1);

-- --------------------------------------------------------

--
-- Table structure for table `responsibility_center`
--

CREATE TABLE `responsibility_center` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `responsibility_center`
--

INSERT INTO `responsibility_center` (`id`, `code`, `name`, `is_active`) VALUES
(1, 'ADJU', 'Adjudication', 1),
(2, 'ALAGAD', 'Aquaculture Livelihood Assistance and Guidance for Adaptive Development', 1),
(3, 'ASA ESSETS', 'ASA Essets', 1),
(4, 'BASIL', 'Balik Siglaw sa Ilog at Lawa', 1),
(5, 'BILIRAN-THO', 'Biliran Tilapia Hatchery-Operation', 1),
(6, 'BILIRAN-THPD', 'Biliran Tilapia Hatchery-Production & Distribution', 1),
(7, 'BORONGAN-THO', 'Borongan Tilapia Hatchery-Operation', 1),
(8, 'BORONGAN-THPD', 'Borongan Tilapia Hatchery-Production & Distribution', 1),
(9, 'CASUAL', 'Casual', 1),
(10, 'CFVGL', 'Commercial Fishing Vessel or Gear License', 1),
(11, 'CRM', 'CRM Center-Operation', 1),
(12, 'DSIP', 'Development of Salt Industry Project', 1),
(13, 'EMU', 'EMU', 1),
(14, 'FARMC', 'Fisheries and Aquatic Resources Management Council', 1),
(15, 'FAD', 'Finance and Administrative Division', 1),
(16, 'FINGERLINGS', 'Fingerlings', 1),
(17, 'RFL8', 'Fish Health Laboratories', 1),
(18, 'GOP', 'FishCORE GOP', 1),
(19, 'FISHCORE', 'FishCORE Loan Proceeds', 1),
(20, 'FIU', 'Fisheries Inspection Unit', 1),
(21, 'FQIS', 'Fisheries Quarantine Inspection Services', 1),
(22, 'FSP', 'Fisheries Scholarship Program', 1),
(23, 'FLA', 'Fishpond Lease Agreement', 1),
(24, 'FMA 3.5M', 'Fisheries Management Area', 1),
(25, 'FRMS', 'Fisheries Resource Management Section', 1),
(26, 'FUEL', 'Fuel Assistance to the Fisherfolk', 1),
(27, 'GAAAO', 'GAAAO and Schedule | of NBC No. 583', 1),
(28, 'HAB', 'Harmful Algal Bloom', 1),
(29, 'IMEMS', 'Integrated Marine Environment Monitoring System', 1),
(30, 'LEGAL', 'Legal Unit', 1),
(32, 'IEC', 'Information, Education and Communication', 1),
(33, 'CAGES', 'Livelihood Cages', 0),
(34, 'MANA', 'Magsaganang Ani Sa Nayon', 1),
(35, 'MD', 'Market Division', 1),
(36, 'MCS', 'Monitoring Control and Surveillance', 1),
(37, 'MP', 'Mariculture Parks', 1),
(38, 'MP(2M)', 'Mariculture Parks (2M)', 1),
(39, 'MP(800K)', 'Mariculture Parks (800K)', 1),
(40, 'NBDP', 'National Bangus Development Program', 1),
(41, 'PFO-BIL', 'PFO-Biliran', 1),
(42, 'PFO-ES', 'PFO-Eastern Samar', 1),
(43, 'PFO-LY', 'PFO-Leyte', 1),
(44, 'PFO-NS', 'PFO-Northern Samar', 1),
(45, 'PFO-SL', 'PFO-Southern Leyte', 1),
(46, 'PFO-WS', 'PFO-Western Samar', 1),
(47, 'PMES', 'Planning, Monitoring & Evaluation Section', 1),
(48, 'PH', 'Post Harvest', 1),
(49, 'RFTFCC', 'Regional Fisheries Training and Fisherfolk Coordination Center', 1),
(50, 'RFIMC', 'Regional Fisheries Information Management Center', 1),
(51, 'SAAD-RO', 'Special Area for Agriculture Development - Regional Office', 1),
(52, 'SAAD-LEYTE', 'Special Area for Agriculture Development - Leyte', 1),
(53, 'SAAD-BILIRAN', 'Special Area for Agriculture Development - Biliran', 1),
(54, 'SAAD-E. SAMAR', 'Special Area for Agriculture Development - Eastern Samar', 1),
(55, 'SAAD-N. SAMAR', 'Special Area for Agriculture Development - Northern Samar', 1),
(56, 'SAAD-W. SAMAR', 'Special Area for Agriculture Development - Western Samar', 1),
(57, 'SAAD-S. LEYTE', 'Special Area for Agriculture Development - Southern Leyte', 1),
(58, 'SDP', 'Seaweed Development Program', 1),
(59, 'SHRIMP', 'Sustainable Shrimp Industry Program', 1),
(60, 'SHRIMP (360K)', 'Sustainable Shrimp Industry Program 360K', 1),
(61, 'TA', 'Technical Assistance', 1),
(62, 'TECHNO DEMO', 'Technology Demonstration', 1),
(63, 'TOS GMFDC-OPERATION', 'Technology Outreach Station GMFDC-Operation', 1),
(64, 'TOS GMFDC-PD', 'Technology Outreach Station GMFDC - Production & Distribution', 1),
(65, 'TOS LMSH-OPERATION', 'Technology Outreach Station LMSH - Operation', 1),
(66, 'TOS LMSH-PD', 'Technology Outreach Station LMSH - Production & Distribution', 1),
(67, 'TOS RBAPC-OPERATION', 'Technology Outreach Station RBAPC - Operation', 1),
(68, 'TOS RBAPC-PD', 'Technology Outreach Station RBAPC - Production & Distribution', 1),
(69, 'TOS RFAPC-OPERATION', 'Technology Outreach Station RFAPC - Operation', 1),
(70, 'TOS RFAPC-PD', 'Technology Outreach Station RFAPC- Production & Distribution', 1),
(71, 'TOS SRAPC-OPERATION', 'Technology Outreach Station SRAPC - Operation', 1),
(72, 'TOS SRAPC-PD', 'Technology Outreach Station SRAPC - Production & Distribution', 1),
(73, 'TRAINING', 'Training', 1),
(74, 'TUNA DEV', 'Tuna Development', 1),
(75, 'UEPTH-OPERATION', 'UEP Tilapia Hatchery - Operation', 1),
(76, 'UEPTH-PD', 'UEP Tilapia Hatchery - Production & Distribution', 1);

-- --------------------------------------------------------

--
-- Table structure for table `signatory`
--

CREATE TABLE `signatory` (
  `id` int(11) NOT NULL,
  `rc_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `position` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `signatory`
--

INSERT INTO `signatory` (`id`, `rc_id`, `name`, `position`, `is_active`) VALUES
(1, 1, 'Atty. Kim Marie R. Babiano', 'OIC, Adjudication', 1),
(2, 4, 'Abraham S. Cera', 'BASIL Focal', 1),
(3, 5, 'Luzviminda H. Robin', 'PFO-Biliran', 1),
(4, 6, 'Luzviminda H. Robin', 'PFO-Biliran', 1),
(5, 7, 'Privy Jane C. Cadlum', 'OIC, Borongan Tilapia Hatchery', 1),
(6, 8, 'Privy Jane C. Cadlum', 'OIC, Borongan Tilapia Hatchery', 1),
(7, 9, 'Karleen R. Destura', 'Chief, FAS', 1),
(8, 10, 'Edmar Kristopher P. Petallana', 'Chief, FMRED', 1),
(9, 11, 'Loreginia P. Briones', 'PFO-Leyte', 1),
(10, 12, 'Loreginia P. Briones', 'Regional DSIP Focal', 1),
(11, 13, 'Christine Jay C. Redona', 'OIC, EMU', 1),
(12, 14, 'Christine N. Gresola', 'FARMC Focal', 1),
(13, 15, 'Karleen R. Destura', 'Chief, FAS', 0),
(14, 15, 'Karleen R. Destura', 'Chief, FAS', 1),
(15, 16, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(16, 17, 'Riza P. Tapdasan', 'Laboratory Manager', 1),
(17, 20, 'Marie Daryl G. Baño', 'Head FIU', 1),
(18, 21, 'Atty. Isidro G. Bajar', 'OIC, FQIS', 1),
(19, 22, 'Lourdes D. Chavez', 'FSP Coordinator', 1),
(20, 23, 'Edmar Kristopher P. Petallana', 'Chief, FMRED', 1),
(21, 24, 'Miriam F. Amigo', 'FMA Focal', 1),
(22, 25, 'Ronnie P. Esmeña', 'OIC, FRMS', 1),
(23, 25, 'Edmar Krsitopher P. Petalla', 'Chief, FMRED', 1),
(24, 26, 'Edmar Kristopher P. Petallana', 'Chief, FMRED', 1),
(25, 28, 'Floremie G. Amora', 'Laboratory Analyst', 1),
(26, 29, 'Elmer T. Bautista', 'OIC, RFIMC', 1),
(27, 30, 'Atty. Duke Lester B. Chua', 'Attorney II/Legal Officer', 1),
(28, 32, 'Christine N. Gresola', 'OIC, IEC', 1),
(29, 34, 'Atty. Grace Fenilda Marquez', 'OIC, PMES', 1),
(30, 35, 'Margie Ruth C. Acabal', 'Head, PHMS', 1),
(31, 36, 'Edmar Kristopher P. Petallana', 'Chief, FMRED', 1),
(32, 37, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(33, 38, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(34, 39, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(35, 40, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(36, 41, 'Luzviminda H. Robin', 'PFO-Biliran', 1),
(37, 42, 'Dan De San Miguel', 'PFO-Eastern Samar', 1),
(38, 43, 'Loreginia P. Briones', 'PFO-Leyte', 1),
(39, 44, 'Maida G. Dela Cruz', 'PFO-Northern Samar', 1),
(40, 45, 'Rowvic B. Docena', 'PFO-Southern Leyte', 1),
(41, 46, 'Marlon C. Sale', 'PFO-Western Samar', 1),
(42, 47, 'Atty. Grace Fenilda Marquez', 'OIC, PMES', 1),
(43, 48, 'Margie Ruth C. Acabal', 'Head, PHMS', 1),
(44, 49, 'Lea A. Tumabiene', 'Chief, RFTFCD', 1),
(45, 50, 'Elmer T. Bautista', 'OIC, RFIMC', 1),
(46, 51, 'Cylet Salvacion C. Lluz', 'Chief, Aquaculturist', 1),
(47, 52, 'Loreginia P. Briones', 'PFO-Leyte', 1),
(48, 53, 'Luzviminda H. Robin', 'PFO-Biliran', 1),
(49, 54, 'Dan De San Miguel', 'PFO-Eastern Samar', 1),
(50, 55, 'Maida G. Dela Cruz', 'PFO-Northern Samar', 1),
(51, 56, 'Marlon C. Sale', 'PFO-Western Samar', 1),
(52, 57, 'Rowvic B. Docena', 'PFO-Southern Leyte', 1),
(53, 58, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(54, 60, 'Molito A. Paclian', 'OIC, JAPTC', 1),
(55, 61, 'Jennifer G. Chan', 'OIC, GSU/Supply & Property Custodian', 1),
(56, 61, 'Karleen R. Destura', 'Chief, FAS', 1),
(57, 62, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(58, 63, 'Manilyn O. Llenares', 'OIC, GMFDC', 1),
(59, 64, 'Manilyn O. Llenares', 'OIC, GMFDC', 1),
(60, 65, 'Khe Jean T. Delizon', 'OIC, LMSH', 1),
(61, 66, 'Khe Jean T. Delizon', 'OIC, LMSH', 1),
(62, 67, 'Felipe G. Balleta', 'OIC, RBAPC', 1),
(63, 68, 'Felipe G. Balleta', 'OIC, RBAPC', 1),
(64, 69, 'Reinafil C. Bernal', 'OIC, RFAPC', 1),
(65, 70, 'Reinafil C. Bernal', 'OIC, RFAPC', 1),
(66, 71, 'Jackie L. Lim', 'OIC, SRAPC', 1),
(67, 72, 'Jackie L. Lim', 'OIC, SRAPC', 1),
(68, 73, 'Lea A. Tumabiene', 'Chief, RFTFCD', 1),
(69, 74, 'Julius Ceasar R. Caballes', 'OIC, FPSSD', 1),
(70, 75, 'Jonas E. Estorba', 'OIC, UEPTH', 1),
(71, 76, 'Jonas E. Estorba', 'OIC, UEPTH', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sub_account_code`
--

CREATE TABLE `sub_account_code` (
  `id` int(11) NOT NULL,
  `account_code_id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sub_account_code`
--

INSERT INTO `sub_account_code` (`id`, `account_code_id`, `code`, `description`, `is_active`) VALUES
(1, 7, '5010205002', 'Magna Carta for Science and Technology RA 8439', 1),
(2, 7, '5010205003', 'Magna Carta for Public Health Worker RA 7305', 1),
(3, 8, '5010206001', 'Laundry Allowance - Civilian', 1),
(4, 8, '5010206003', 'Magna Carta for Science and Technology RA 8439', 1),
(5, 8, '5010206004', 'Magna Carta for Public Health Worker RA 7305', 1),
(6, 9, '5010207001', 'Quarters Allowance - Civilian', 1),
(7, 9, '5010207003', 'Magna Carta for Science and Technology RA 8439', 1),
(8, 9, '5010207004', 'Magna Carta for Public Health Worker RA 7305', 1),
(9, 9, '5010210001', 'Honoraria - Civilian', 1),
(10, 9, '5010211002', 'Hazard Pay - Civilian', 1),
(11, 9, '5010212001', 'Longevity  Pay', 1),
(12, 15, '5010213001', 'Overtime Pay', 1),
(13, 15, '5010213002', 'Night Shift Differential Pay', 1),
(14, 27, '5010299001', 'Per Diems - Civilian', 1),
(15, 27, '5010299003', 'Allowance of Attoney\'s de Officio - Civilian', 1),
(16, 27, '5010299006', 'Inquest Allowance - Civilian', 1),
(17, 27, '5010299007', 'Special Duty Allowance - Civilian', 1),
(18, 27, '5010299011', 'Collective Negotiation Agreement Incentive - Civilian', 1),
(19, 27, '5010299012', 'Productivity Enhancement Incentive - Civilian', 1),
(20, 27, '5010299014', 'Performance Based Bonus - Civilian', 1),
(21, 27, '5010299038', 'Anniversary - Civilian', 1),
(22, 49, '5020201001', 'ICT Training Expenses', 1),
(23, 49, '5020309002', 'Training Expenses', 1),
(24, 51, '5020301001', 'ICT Office Supplies Expenses', 1),
(25, 51, '5020301002', 'Office Supplies Expenses', 1),
(26, 60, '5020301001', 'Textbook and Instructional Material Expenses', 1),
(27, 60, '5020301002', 'Chalk Allowance', 1),
(28, 107, '5020321001', 'Machinery', 1),
(29, 107, '5020321002', 'Office Equipment', 1),
(30, 107, '5020321003', 'Information and Communication Technology Equipment - ICT', 1),
(31, 107, '5020321004', 'Agriculture and Forestry Equipment', 1),
(32, 107, '5020321005', 'Marine and Fishery Equipment', 1),
(33, 107, '5020321007', 'Communication Equipment', 1),
(34, 107, '5020321008', 'Disaster Response and Rescue Equipment', 1),
(35, 107, '5020321009', 'Military, Police and Security Equipment', 1),
(36, 107, '5020321010', 'Medical Equipment', 1),
(37, 107, '5020321011', 'Printing Equipment', 1),
(38, 107, '5020321012', 'Sports Equipment', 1),
(39, 107, '5020321013', 'Technical and Scientific Equipment', 1),
(40, 107, '5020321099', 'Other Machinery  and  Equipment', 1),
(41, 108, '5020322001', 'Furniture and Fixture', 1),
(42, 108, '5020322002', 'Books', 1),
(43, 74, '5020502001', 'Mobile', 1),
(44, 74, '5020502002', 'Landline', 1),
(45, 74, '5020601001', 'Awards/ Rewards Expenses', 1),
(46, 74, '5020601002', 'Rewards and Incentives', 1),
(47, 80, '5020701001', 'ICT Survey Expenses', 1),
(48, 80, '5020701002', 'Survey Expenses', 1),
(49, 81, '5020702001', 'ICT Research, Exploration and Development Expenses', 1),
(50, 81, '5020702002', 'Research, Exploration and Development Expenses', 1),
(51, 91, '5021103001', 'ICT Consultancy Services', 1),
(52, 91, '5021103002', 'Consultancy Services', 1),
(53, 98, '5021302001', 'Aquaculture Structures', 1),
(54, 98, '5021302002', 'Reforestation Projects', 1),
(55, 98, '5021302099', 'Other Land Improvements', 1),
(56, 99, '5021303001', 'Road Networks', 1),
(57, 99, '5021303004', 'Water Supply Systems', 1),
(58, 99, '5021303005', 'Power Supply Systems', 1),
(59, 99, '5021303006', 'Communications Network', 1),
(60, 99, '5021303007', 'Seaport System', 1),
(61, 99, '5021303099', 'Other Infrastructure Assets', 1),
(62, 100, '5021304001', 'Buildings', 1),
(63, 100, '5021304004', 'Markets', 1),
(64, 100, '5021304005', 'Slaughterhouses', 1),
(65, 100, '5021304006', 'Hostels and Dormitories', 1),
(66, 100, '5021304099', 'Other Structures', 1),
(67, 101, '5021305001', 'Machinery', 1),
(68, 101, '5021305002', 'Office Equipment', 1),
(69, 101, '5021305003', 'Information and Communication Technology  Equipment - ICT', 1),
(70, 101, '5021305004', 'Agricultural and Forestry Equipment', 1),
(71, 101, '5021305005', 'Marine and Fishery Equipment', 1),
(72, 101, '5021305007', 'Communication Equipment', 1),
(73, 101, '5021305008', 'Construction and Heavy Equipment', 1),
(74, 101, '5021305009', 'Disaster Response and Rescue Equipment', 1),
(75, 101, '5021305010', 'Military, Police and Security Equipment', 1),
(76, 101, '5021305011', 'Medical Equipment', 1),
(77, 101, '5021305012', 'Printing Equipment', 1),
(78, 101, '5021305013', 'Sports Equipment', 1),
(79, 101, '5021305014', 'Technical and Scientific Equipment', 1),
(80, 101, '5021305099', 'Other Machineries and Equipment', 1),
(81, 102, '5021306001', 'Motor Vehicle', 1),
(82, 102, '5021306004', 'Watercrafts', 1),
(83, 102, '5021306099', 'Other Transportation Equipment', 1),
(84, 104, '5021308001', 'Buildings and Other Structures', 1),
(85, 104, '5021308002', 'Machinery and Equipment', 1),
(86, 104, '5021308003', 'Transportation Equipment', 1),
(87, 104, '5021308004', 'ICT Machinery and Equipment', 1),
(88, 104, '5021308099', 'Other Leased Assets', 1),
(89, 105, '5021309001', 'Lands', 1),
(90, 105, '5021309002', 'Buildings', 1),
(91, 105, '5021309099', 'Other Leased Assets Improvements', 1),
(92, 107, '5021321001', 'Machinery', 1),
(93, 107, '5021321002', 'Office Equipment', 1),
(94, 107, '5021321003', 'Information and Communication Technology Equipment - ICT', 1),
(95, 107, '5021321004', 'Agriculture  and Forestry Equipment', 1),
(96, 107, '5021321005', 'Marine and Fishery Equipment', 1),
(97, 107, '5021321007', 'Communication Equipment', 1),
(98, 107, '5021321008', 'Disaster Response and Rescue Equipment', 1),
(99, 107, '5021321009', 'Military, Police and Security Equipment', 1),
(100, 107, '5021321010', 'Medical Equipment', 1),
(101, 107, '5021321011', 'Printing Equipment', 1),
(102, 107, '5021321012', 'Sports Equipment', 1),
(103, 107, '5021321013', 'Technical  and  Scientific Equipment', 1),
(104, 107, '5021321099', 'Other Machinery  and  Equipment', 1),
(105, 108, '5021322001', 'Furniture and Fixtures', 1),
(106, 108, '5021322002', 'Books', 1),
(107, 110, '5021399001', 'Work/Zoo Animals', 1),
(108, 110, '5021399099', 'Other Property, Plant and Equipment', 1),
(109, 113, '5021403001', 'Tobacco Excise Tax (Virginia) per RA 7171', 1),
(110, 113, '5021403002', 'Tobacco Excise Tax (Burley and Native) per RA 8240', 1),
(111, 113, '5021403005', 'Forestry Charges per RA 7160', 1),
(112, 113, '5021403000', 'Financial Assistance to LGUs', 1),
(113, 114, '5021404001', 'Budgetary Support to Operations of GOCCs', 1),
(114, 114, '5021404002', 'Road Networks', 1),
(115, 114, '5021404005', 'Water Supply System', 1),
(116, 114, '5021404006', 'Power Supply System', 1),
(117, 114, '5021404007', 'Communication Networks', 1),
(118, 114, '5021404008', 'Seaport Systems', 1),
(119, 114, '5021404099', 'Other Infrastructure Assets', 1),
(120, 121, '5021501001', 'Taxes, Duties and Licenses', 1),
(121, 121, '5021501002', 'Tax Refund', 1),
(122, 129, '5029905001', 'Building and Structures', 1),
(123, 129, '5029905002', 'Land', 1),
(124, 129, '5029905003', 'Motor Vehicle', 1),
(125, 129, '5029905004', 'Equipment', 1),
(126, 129, '5029905005', 'Living Quarters', 1),
(127, 129, '5029905006', 'Operating Lease', 1),
(128, 129, '5029905007', 'Finance Lease', 1),
(129, 129, '5029905008', 'ICT Machinery and Equipment', 1),
(130, 131, '5029907001', 'ICT Software Subscription', 1),
(131, 131, '5029907002', 'Data Center Service', 1),
(132, 131, '5029907003', 'Cloud Computing Service', 1),
(133, 131, '5029907004', 'Library and Other Reading Materials Subscription', 1),
(134, 131, '5029907099', 'Other Subscription Expenses', 1),
(135, 137, '5029999001', 'Website Maintenance', 1),
(136, 137, '5029999099', 'Other Maintenance and Operating Expenses', 1),
(137, 138, '5060402001', 'Aquaculture Structures', 1),
(139, 138, '5060402002', 'Reforestation Projects', 1),
(140, 138, '5060402003', 'Other Land Improvements', 1),
(141, 139, '5060403001', 'Road Networks', 1),
(142, 139, '5060403004', 'Water Supply Systems', 1),
(143, 139, '5060403005', 'Power Supply System', 1),
(144, 139, '5060403006', 'Communication Networks', 1),
(145, 139, '5060403007', 'Seaport System', 1),
(146, 139, '5060403099', 'Other Infrastructure Assets', 1),
(147, 140, '5060404001', 'Buildings', 1),
(148, 140, '5060404002', 'Markets', 1),
(149, 140, '5060404005', 'Slaughterhouses', 1),
(150, 140, '5060404006', 'Hostels and Dormitories', 1),
(151, 140, '5060404099', 'Other Structures', 1),
(152, 141, '5060405001', 'Machinery', 1),
(153, 141, '5060405002', 'Office Equipment', 1),
(154, 141, '5060405003', 'Information and Communication Technology', 1),
(155, 141, '5060405004', 'Agriculture and Forestry Equipment', 1),
(156, 141, '5060405005', 'Marine and fishery Equipment', 1),
(157, 141, '5060405007', 'Communication Equipment', 1),
(158, 141, '5060405008', 'Construction and Heavy Equipment', 1),
(159, 141, '5060405009', 'Disaster Response  and  Rescue  Equipment', 1),
(160, 141, '5060405010', 'Military, Police and Security Equipment', 1),
(161, 141, '5060405011', 'Medical Equipment', 1),
(162, 141, '5060405012', 'Printing Equipment', 1),
(163, 141, '5060405013', 'Sports Equipment', 1),
(164, 141, '5060405014', 'Technical and Scientific Equipment', 1),
(165, 141, '5060405015', 'ICT Software', 1),
(166, 141, '5060405099', 'Other Machinery and Equipment', 1),
(167, 142, '5060406001', 'Motor Vehicle', 1),
(168, 142, '5060406004', 'Watercrafts', 1),
(169, 142, '5060406099', 'Other Transportation Equipment', 1),
(170, 143, '5060407001', 'Furniture and Fixtures', 1),
(171, 143, '5060407002', 'Books', 1),
(172, 145, '5060501001', 'Breeding Stocks', 1),
(173, 145, '5060501002', 'Livestock', 1),
(174, 145, '5060501003', 'Trees, Plants and Crops', 1),
(175, 145, '5060501004', 'Aquaculture', 1),
(176, 145, '5060501099', 'Other Bearer Biological Assets', 1),
(177, 146, '5060502001', 'Livestock Held for Consumption/ Sale/ Distribution', 1),
(178, 146, '5060502002', 'Trees, Plants and Crops Held for Consumption /Sale/ Distribution', 1),
(179, 146, '5060502003', 'Agricultural Produce Held for Consumption /Sale/ Distribution', 1),
(180, 146, '5060502004', 'Aquaculture', 1),
(181, 146, '5060502099', 'Other Consumable Assets', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'staff',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'budget_admin', '$2a$12$aaimYL5tVsIvAXSJDEOLAONj7sYkG6kC7b2uQd/8xcRNCFCgpcA/i', 'Budget Administrator', 'admin@bfar.gov.ph', 'admin', 1, '2026-06-29 08:53:42', '2026-06-20 22:58:08', '2026-06-29 08:53:42'),
(2, 'budget_staff', '$2a$12$HxAEk9cQ83By5e1X53XOEeAGI8ZucCswVjUOQzvl9D/QiiRXe78Iy', 'Budget Staff', 'staff@bfar.gov.ph', 'staff', 1, '2026-07-06 10:53:17', '2026-06-20 22:58:08', '2026-07-06 10:53:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account_code`
--
ALTER TABLE `account_code`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_account_code` (`code`),
  ADD KEY `fk_acctcode_exptype` (`expense_type_id`);

--
-- Indexes for table `activity_level`
--
ALTER TABLE `activity_level`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_activity_subcat` (`project_sub_category_id`);

--
-- Indexes for table `allotments`
--
ALTER TABLE `allotments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_allotment` (`rc_id`,`fund_id`,`expense_class_id`,`fiscal_year`),
  ADD KEY `fk_allot_fund` (`fund_id`),
  ADD KEY `fk_allot_class` (`expense_class_id`),
  ADD KEY `fk_allot_acct` (`account_code_id`);

--
-- Indexes for table `earmarks`
--
ALTER TABLE `earmarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pr_no` (`pr_no`),
  ADD KEY `fk_em_rc` (`rc_id`),
  ADD KEY `fk_em_signatory` (`signatory_id`),
  ADD KEY `fk_em_activity` (`activity_level_id`),
  ADD KEY `fk_em_acct` (`account_code_id`),
  ADD KEY `fk_em_subacct` (`sub_account_code_id`),
  ADD KEY `fk_em_fund` (`fund_id`);

--
-- Indexes for table `expense_class`
--
ALTER TABLE `expense_class`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_class_code` (`code`);

--
-- Indexes for table `expense_type`
--
ALTER TABLE `expense_type`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_exptype_class` (`expense_class_id`);

--
-- Indexes for table `fund`
--
ALTER TABLE `fund`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `obligations`
--
ALTER TABLE `obligations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ors_no` (`ors_no`),
  ADD KEY `fk_obl_rc` (`rc_id`),
  ADD KEY `fk_obl_signatory` (`signatory_id`),
  ADD KEY `fk_obl_activity` (`activity_level_id`),
  ADD KEY `fk_obl_acct` (`account_code_id`),
  ADD KEY `fk_obl_subacct` (`sub_account_code_id`);

--
-- Indexes for table `program`
--
ALTER TABLE `program`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_category`
--
ALTER TABLE `project_category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projcat_program` (`program_id`);

--
-- Indexes for table `project_sub_category`
--
ALTER TABLE `project_sub_category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projsubcat_projcat` (`project_category_id`),
  ADD KEY `fk_psub_program` (`program_id`);

--
-- Indexes for table `responsibility_center`
--
ALTER TABLE `responsibility_center`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rc_code` (`code`);

--
-- Indexes for table `signatory`
--
ALTER TABLE `signatory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_signatory_rc` (`rc_id`);

--
-- Indexes for table `sub_account_code`
--
ALTER TABLE `sub_account_code`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_subacct_acct` (`account_code_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_code`
--
ALTER TABLE `account_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `activity_level`
--
ALTER TABLE `activity_level`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `allotments`
--
ALTER TABLE `allotments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `earmarks`
--
ALTER TABLE `earmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `expense_class`
--
ALTER TABLE `expense_class`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `expense_type`
--
ALTER TABLE `expense_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `fund`
--
ALTER TABLE `fund`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `obligations`
--
ALTER TABLE `obligations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `program`
--
ALTER TABLE `program`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_category`
--
ALTER TABLE `project_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `project_sub_category`
--
ALTER TABLE `project_sub_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `responsibility_center`
--
ALTER TABLE `responsibility_center`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `signatory`
--
ALTER TABLE `signatory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `sub_account_code`
--
ALTER TABLE `sub_account_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=182;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_code`
--
ALTER TABLE `account_code`
  ADD CONSTRAINT `fk_acctcode_exptype` FOREIGN KEY (`expense_type_id`) REFERENCES `expense_type` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `activity_level`
--
ALTER TABLE `activity_level`
  ADD CONSTRAINT `fk_activity_subcat` FOREIGN KEY (`project_sub_category_id`) REFERENCES `project_sub_category` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `allotments`
--
ALTER TABLE `allotments`
  ADD CONSTRAINT `fk_allot_acct` FOREIGN KEY (`account_code_id`) REFERENCES `account_code` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_allot_class` FOREIGN KEY (`expense_class_id`) REFERENCES `expense_class` (`id`),
  ADD CONSTRAINT `fk_allot_fund` FOREIGN KEY (`fund_id`) REFERENCES `fund` (`id`),
  ADD CONSTRAINT `fk_allot_rc` FOREIGN KEY (`rc_id`) REFERENCES `responsibility_center` (`id`);

--
-- Constraints for table `earmarks`
--
ALTER TABLE `earmarks`
  ADD CONSTRAINT `fk_em_acct` FOREIGN KEY (`account_code_id`) REFERENCES `account_code` (`id`),
  ADD CONSTRAINT `fk_em_activity` FOREIGN KEY (`activity_level_id`) REFERENCES `activity_level` (`id`),
  ADD CONSTRAINT `fk_em_fund` FOREIGN KEY (`fund_id`) REFERENCES `fund` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_em_rc` FOREIGN KEY (`rc_id`) REFERENCES `responsibility_center` (`id`),
  ADD CONSTRAINT `fk_em_signatory` FOREIGN KEY (`signatory_id`) REFERENCES `signatory` (`id`),
  ADD CONSTRAINT `fk_em_subacct` FOREIGN KEY (`sub_account_code_id`) REFERENCES `sub_account_code` (`id`);

--
-- Constraints for table `expense_type`
--
ALTER TABLE `expense_type`
  ADD CONSTRAINT `fk_exptype_class` FOREIGN KEY (`expense_class_id`) REFERENCES `expense_class` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `obligations`
--
ALTER TABLE `obligations`
  ADD CONSTRAINT `fk_obl_acct` FOREIGN KEY (`account_code_id`) REFERENCES `account_code` (`id`),
  ADD CONSTRAINT `fk_obl_activity` FOREIGN KEY (`activity_level_id`) REFERENCES `activity_level` (`id`),
  ADD CONSTRAINT `fk_obl_rc` FOREIGN KEY (`rc_id`) REFERENCES `responsibility_center` (`id`),
  ADD CONSTRAINT `fk_obl_signatory` FOREIGN KEY (`signatory_id`) REFERENCES `signatory` (`id`),
  ADD CONSTRAINT `fk_obl_subacct` FOREIGN KEY (`sub_account_code_id`) REFERENCES `sub_account_code` (`id`);

--
-- Constraints for table `project_category`
--
ALTER TABLE `project_category`
  ADD CONSTRAINT `fk_projcat_program` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_sub_category`
--
ALTER TABLE `project_sub_category`
  ADD CONSTRAINT `fk_projsubcat_projcat` FOREIGN KEY (`project_category_id`) REFERENCES `project_category` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_psub_program` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `signatory`
--
ALTER TABLE `signatory`
  ADD CONSTRAINT `fk_signatory_rc` FOREIGN KEY (`rc_id`) REFERENCES `responsibility_center` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `sub_account_code`
--
ALTER TABLE `sub_account_code`
  ADD CONSTRAINT `fk_subacct_acct` FOREIGN KEY (`account_code_id`) REFERENCES `account_code` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
