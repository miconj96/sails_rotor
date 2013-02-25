-- MySQL dump 10.13  Distrib 5.5.8, for Win32 (x86)
--
-- Host: localhost    Database: sales_rotor
-- ------------------------------------------------------
-- Server version	5.5.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `mst_user`
--

DROP TABLE IF EXISTS `mst_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mst_user` (
  `name` varchar(45) NOT NULL DEFAULT '',
  `password` varchar(45) NOT NULL DEFAULT '',
  `groupname` varchar(45) NOT NULL DEFAULT '',
  `status` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_user`
--

LOCK TABLES `mst_user` WRITE;
/*!40000 ALTER TABLE `mst_user` DISABLE KEYS */;
INSERT INTO `mst_user` VALUES ('admin','111','admin','Enabled'),('manager','111','manager','Enabled'),('reception','111','reception','Enabled'),('sales','111','sales','Enabled');
/*!40000 ALTER TABLE `mst_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_category`
--

DROP TABLE IF EXISTS `tbl_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_category` (
  `id_cat` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `linkname` varchar(45) DEFAULT NULL COMMENT 'Describes persons that belong in this category linked to what kind of category.',
  `avail_tourlink` varchar(45) NOT NULL DEFAULT '' COMMENT 'to this category link name',
  `avail_otherlink` varchar(45) DEFAULT NULL COMMENT '2: General Information 3: Be back/owner referral 4: Quality of life',
  `avail_movelink` varchar(45) NOT NULL DEFAULT '',
  `managercategory` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id_cat`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_category`
--

LOCK TABLES `tbl_category` WRITE;
/*!40000 ALTER TABLE `tbl_category` DISABLE KEYS */;
INSERT INTO `tbl_category` VALUES (1,'Direct','D','1,2','2,3,4','2,3,4',NULL),(2,'In House','IH','1,2','2,3,4','1,3,4',NULL),(3,'Manager','M','3','3,4','1,2,4',NULL),(4,'Explorer','E','4','3,4','1,2,3',NULL);
/*!40000 ALTER TABLE `tbl_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_manager`
--

DROP TABLE IF EXISTS `tbl_manager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_manager` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `personid` varchar(45) NOT NULL DEFAULT '',
  `managerid` varchar(45) NOT NULL DEFAULT '',
  `applytime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_manager`
--

LOCK TABLES `tbl_manager` WRITE;
/*!40000 ALTER TABLE `tbl_manager` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_manager` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_person`
--

DROP TABLE IF EXISTS `tbl_person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_person` (
  `id_person` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(45) NOT NULL DEFAULT '',
  `lastname` varchar(45) DEFAULT NULL,
  `available` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0: unavailable 1: available',
  `category_status` varchar(45) NOT NULL DEFAULT '',
  `portal_status` varchar(45) NOT NULL DEFAULT '',
  `description` varchar(45) NOT NULL DEFAULT '',
  `managerid` varchar(45) NOT NULL DEFAULT '',
  `managername` varchar(45) NOT NULL DEFAULT '',
  `assignedtime` varchar(45) NOT NULL DEFAULT '',
  `managestatus` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0: not manage, 1 manager set, 2 manager left',
  `id_reports` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_person`)
) ENGINE=MyISAM AUTO_INCREMENT=76 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_person`
--

LOCK TABLES `tbl_person` WRITE;
/*!40000 ALTER TABLE `tbl_person` DISABLE KEYS */;
INSERT INTO `tbl_person` VALUES (63,'asdf',NULL,1,'direct','','','','','',0,6),(64,'zxcv',NULL,1,'direct','beback','','71','m1','20:33 PM',1,16),(65,'mmmm',NULL,1,'explorer','','','','','',0,0),(70,'asdfasdf',NULL,1,'inhouse','','','','','',0,0),(71,'m1',NULL,1,'manager','managertour','','','','',0,17),(72,'m2',NULL,1,'manager','beback','','','','',0,14),(73,'m3',NULL,1,'manager','','','','','',0,11),(74,'m4',NULL,1,'manager','','','','','',0,0),(75,'sdafdsaf',NULL,1,'direct','','','','','',0,10);
/*!40000 ALTER TABLE `tbl_person` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_reports`
--

DROP TABLE IF EXISTS `tbl_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_reports` (
  `id_reports` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdate` date NOT NULL,
  `tourtype` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `tour_start` datetime NOT NULL,
  `manager` varchar(100) NOT NULL,
  `manager_name` varchar(100) NOT NULL,
  `manager_start` datetime NOT NULL,
  `manager_end` datetime NOT NULL,
  `tour_end` datetime NOT NULL,
  PRIMARY KEY (`id_reports`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_reports`
--

LOCK TABLES `tbl_reports` WRITE;
/*!40000 ALTER TABLE `tbl_reports` DISABLE KEYS */;
INSERT INTO `tbl_reports` VALUES (10,'2012-06-23','directtour','sdafdsaf','2012-06-23 19:52:30','73','m3','2012-06-23 19:52:39','2012-06-23 19:53:19','2012-06-23 19:53:44'),(11,'2012-06-23','managertour','m3','2012-06-23 19:52:39','','','0000-00-00 00:00:00','0000-00-00 00:00:00','2012-06-23 19:53:19'),(12,'2012-06-23','inhousetour','zxcv','2012-06-23 20:10:55','','','0000-00-00 00:00:00','0000-00-00 00:00:00','2012-06-23 20:29:01'),(13,'2012-06-23','managertour','m2','2012-06-23 20:28:55','','','0000-00-00 00:00:00','0000-00-00 00:00:00','2012-06-23 20:28:58'),(14,'2012-06-23','beback','m2','2012-06-23 20:28:58','','','0000-00-00 00:00:00','0000-00-00 00:00:00','0000-00-00 00:00:00'),(15,'2012-06-23','ginfo','zxcv','2012-06-23 20:29:01','','','0000-00-00 00:00:00','0000-00-00 00:00:00','2012-06-23 20:29:05'),(16,'2012-06-23','beback','zxcv','2012-06-23 20:29:05','71','m1','2012-06-23 20:33:41','0000-00-00 00:00:00','0000-00-00 00:00:00'),(17,'2012-06-23','managertour','m1','2012-06-23 20:33:41','','','0000-00-00 00:00:00','0000-00-00 00:00:00','0000-00-00 00:00:00');
/*!40000 ALTER TABLE `tbl_reports` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2012-06-23 21:08:50
