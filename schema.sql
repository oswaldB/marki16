--
-- PostgreSQL database dump
--

\restrict 04xd9ZDCGVPQ15FC2k1VgkGfnmfyvKNDdHl5ZUXSboX9tHffH4meUhJZJApeEgJ

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg120+1)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: webadmin2
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO webadmin2;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: webadmin2
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: (ADN_DIAG) APH; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APH" (
    "idMission" integer NOT NULL,
    "idTypeBien" integer,
    "intituleBien" character varying(255),
    usage character varying(255),
    "regimeUnique" boolean,
    erp boolean,
    cd boolean,
    li boolean,
    lp boolean,
    erpn boolean,
    "titreDocument" character varying(255),
    "titreConclusion" character varying(255),
    existence boolean,
    "existeNonConf" text,
    "nbrBat" integer,
    "nbrEscPrin" integer,
    "nbrEscSec" integer,
    "nbrAsc" integer,
    "CompteurPlan" integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APH" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHAttestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHAttestation" (
    "idAttestation" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idRegime" character varying(10) NOT NULL,
    datt timestamp without time zone,
    "NumContrat" character varying(255),
    organisme boolean,
    architecte boolean,
    "NumContratVerifTech" character varying(255),
    "dateContratVerifTech" timestamp without time zone,
    "SteMaitreOuv" character varying(255),
    operation text,
    "RefPC" character varying(50),
    "dateDepotPC" timestamp without time zone,
    "datePC" timestamp without time zone,
    "NbrBat" integer,
    "dateSignature" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHAttestation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHConformite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHConformite" (
    "idConformite" integer NOT NULL,
    "idTheme" integer NOT NULL,
    "idParent" integer,
    conformite character varying(255),
    "handMoteur" boolean,
    "handVisuel" boolean,
    "handPsy" boolean,
    "handSourd" boolean,
    aide text,
    ordre integer,
    "constatGnlDef" text,
    "constatLocDef" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHConformite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHConstatConformite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHConstatConformite" (
    "idConstat" integer NOT NULL,
    "idConformite" integer NOT NULL,
    constat text,
    "numConstat" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHConstatConformite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHDerogation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHDerogation" (
    "idDerogation" integer NOT NULL,
    "idAttestation" integer NOT NULL,
    "titreDerogation" character varying(50),
    derogation text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHDerogation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHDocAttestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHDocAttestation" (
    "idDoc" integer NOT NULL,
    "idAttestation" integer NOT NULL,
    intitule character varying(225),
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHDocAttestation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHFichierAide; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHFichierAide" (
    "idFichier" integer NOT NULL,
    "idConformite" integer NOT NULL,
    fichier character varying(255),
    titre character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHFichierAide" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHGeneration; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHGeneration" (
    "idGeneration" integer NOT NULL,
    "idMission" integer NOT NULL,
    type character varying(50),
    "typeGeneration" character varying(50),
    "annexePhoto" boolean,
    "annexeNum" boolean,
    "annexePap" boolean,
    "annexeSynthese" boolean,
    "listeInter" boolean,
    historique boolean,
    zone boolean,
    "jeuMat" character varying(255),
    "constatGnl" boolean,
    "themeSynthese" boolean,
    "LocparPlan" boolean,
    "photoLoc" boolean,
    attest boolean,
    "Classement" boolean
);


ALTER TABLE public."(ADN_DIAG) APHGeneration" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHLocalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHLocalisation" (
    "idLocalisation" integer NOT NULL,
    "discLocalisation" integer NOT NULL,
    "idParent" integer,
    "idTypeBien" integer,
    "Localisation" character varying(255),
    "idModele" integer NOT NULL,
    ordre integer,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHLocalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHModeleLocalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHModeleLocalisation" (
    "idModele" integer NOT NULL,
    modele character varying(255),
    "idTypeBien" integer,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHModeleLocalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHModificationPC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHModificationPC" (
    "idModifPC" integer NOT NULL,
    "idAttestation" integer NOT NULL,
    "dateModif" timestamp without time zone,
    "titreModif" character varying(50),
    modif text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHModificationPC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHParam" (
    "idPara" integer NOT NULL,
    "cheminGeneration" character varying(255),
    "modeDetail" boolean,
    type character varying(50),
    "typeGeneration" character varying(50),
    "annexePhoto" boolean,
    "annexeNum" boolean,
    "annexePap" boolean,
    "annexeSynthese" boolean,
    "listeInter" boolean,
    historique boolean,
    zone boolean,
    "jeuMat" character varying(255),
    "constatGnl" boolean,
    "themeSynthese" boolean,
    "editGrille" boolean,
    "imageDir" character varying(255),
    "LocparPlan" boolean,
    "confMemory" boolean,
    "locMemory" boolean,
    "useCntPlan" boolean,
    "photoLoc" boolean,
    attest boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "Classement" boolean
);


ALTER TABLE public."(ADN_DIAG) APHParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHPlancommun; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHPlancommun" (
    "idPlan" integer NOT NULL,
    "idMission" integer NOT NULL,
    "Largeur" real,
    "Longueur" real,
    "Orientation" character varying(50),
    "idResPlan" uuid,
    "previewDataPlan" bytea,
    "titrePlan" character varying(50),
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHPlancommun" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHRegime; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHRegime" (
    "idRegime" character varying(10) NOT NULL,
    regime character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHRegime" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatConformite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatConformite" (
    "idResultat" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idConformite" integer NOT NULL,
    "idConformiteParticuliere" integer,
    conformite character varying(255),
    "R" boolean,
    "NR" boolean,
    "SO" boolean,
    "NV" boolean,
    commentaire text,
    "cheminPhoto" character varying(255),
    "handMoteur" boolean,
    "handVisuel" boolean,
    "handPsy" boolean,
    "handSourd" boolean,
    ordre integer,
    urg1 boolean,
    urg2 boolean,
    urg3 boolean,
    urg4 boolean,
    "numCommentaire" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) APHResultatConformite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatHistorique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatHistorique" (
    "idHistorique" integer NOT NULL,
    "idMission" integer NOT NULL,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    objet character varying(255),
    lieu character varying(255),
    type character varying(255),
    intervenant text,
    commentaire text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHResultatHistorique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatIntervenant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatIntervenant" (
    "idInter" integer NOT NULL,
    "idMission" integer NOT NULL,
    type character varying(255),
    nom character varying(255),
    adresse character varying(255),
    commentaire text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHResultatIntervenant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatLocalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatLocalisation" (
    "idLocalisation" integer NOT NULL,
    "discLocalisation" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idRegime" character varying(10) NOT NULL,
    "idParent" integer,
    ordre integer,
    localisation character varying(255),
    "isPermis" boolean,
    "titrePermission" character varying(255),
    permission text,
    "idPlan" integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "Statut" character varying(1)
);


ALTER TABLE public."(ADN_DIAG) APHResultatLocalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatLocalisationConformite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatLocalisationConformite" (
    "idResultat" integer NOT NULL,
    "idLocalisation" integer NOT NULL,
    "idConformiteParticuliere" integer,
    localisation text,
    "R" boolean,
    "NR" boolean,
    "SO" boolean,
    "NV" boolean,
    urg1 boolean,
    urg2 boolean,
    urg3 boolean,
    urg4 boolean,
    "conformiteLocalise" character varying(255),
    "idResConformite" uuid,
    "previewDataConformite" bytea,
    "titreConformite" character varying(50),
    "idResLocalisation" uuid,
    "previewDataLocalisation" bytea,
    "titreLocalisation" character varying(50),
    "libellePlanCommun" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) APHResultatLocalisationConformite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatRegime; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatRegime" (
    "idMission" integer NOT NULL,
    "idRegime" character varying(10) NOT NULL,
    synthese text,
    lbl character varying(255)
);


ALTER TABLE public."(ADN_DIAG) APHResultatRegime" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatRegimeDetail; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatRegimeDetail" (
    "idDetailGene" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idRegime" character varying(10) NOT NULL,
    question character varying(255),
    oui boolean,
    non boolean,
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) APHResultatRegimeDetail" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatTravaux" (
    "idResTravaux" integer NOT NULL,
    "idResultat" integer NOT NULL,
    "idLocalisation" integer NOT NULL,
    travaux text,
    detail text,
    urgence integer,
    "coutMinForfait" real,
    "coutMaxForfait" real,
    "coutMinM2" real,
    "coutMaxM2" real,
    surface real,
    avantage text,
    inconvenient text,
    ordre integer,
    "idParamTravaux" integer,
    "isPermis" boolean,
    "titrePermission" character varying(255),
    permission text,
    unite character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) APHResultatTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHResultatZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHResultatZone" (
    "idZone" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idRegime" character varying(10) NOT NULL,
    numero character varying(50),
    zone character varying(255),
    nv boolean,
    justification text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) APHResultatZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHTheme; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHTheme" (
    "idTheme" integer NOT NULL,
    "discTheme" integer NOT NULL,
    "idParent" integer,
    "idRegime" character varying(10),
    intitule character varying(255),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHTheme" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHTravaux" (
    "idTravaux" integer NOT NULL,
    "idConformite" integer NOT NULL,
    "Travaux" text,
    detail text,
    urgence real,
    "coutMinForfait" real,
    "coutMaxForfait" real,
    "coutMinM2" real,
    "coutMaxM2" real,
    surface real,
    avantage text,
    inconvenient text,
    ordre integer,
    unite character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHTypeAnnexe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHTypeAnnexe" (
    "idAnnexe" integer NOT NULL,
    "typeAnnexe" character varying(255),
    titre character varying(255),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHTypeAnnexe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHUrgence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHUrgence" (
    "idUrgence" integer NOT NULL,
    urgence integer,
    titre character varying(50),
    type character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) APHUrgence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) APHphotosBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) APHphotosBien" (
    "idPh" integer NOT NULL,
    "idMission" integer NOT NULL,
    ordre integer,
    pg boolean,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) APHphotosBien" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Amiante; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Amiante" (
    "idMission" integer NOT NULL,
    "idLaboratoire" integer,
    "c1Mur" character varying(50),
    "c1Poteaux" character varying(50),
    "c1Cloisons" character varying(50),
    "c1Gaines" character varying(50),
    "c2Plafonds" character varying(50),
    "c2Poutres" character varying(50),
    "c2Gaines" character varying(50),
    "c2FauxPlafond" character varying(50),
    "c2Planchers" character varying(50),
    "c3Conduits" character varying(50),
    c3volets character varying(50),
    "c3PorteCoupeFeu" character varying(50),
    "c3VideOrdure" character varying(50),
    "c4Ascenseur" character varying(50),
    c5 character varying(100),
    prelevement character varying(255),
    "analyse" character varying(255),
    "conclusionAmiante" text,
    annexe1 boolean,
    annexe2 boolean,
    annexe3 boolean,
    annexe4 boolean,
    annexe5 boolean,
    annexe6 boolean,
    "commentairesAmiante" text,
    dta boolean,
    "nbPagesAnnexeLabo" smallint,
    "modalitesDTA" text,
    "detenteurDTA" character varying(50),
    "typeDocumentAmiante" character varying(50),
    "travauxDTA" text,
    "libelleDocument" character varying(100),
    "titreDocument" character varying(255),
    "noteAmiante" text,
    "isGenererTableauAPSO" boolean,
    "isGenererColonneAPSO" boolean,
    "isGenererAttestationCompetence" boolean,
    "conditionReperage" text,
    "isGenererTableauRevetement" boolean,
    "isGenererCertificat" boolean,
    "isGenererObligationProp" boolean,
    "idResMemoVocal" uuid,
    "ChangeTime" timestamp without time zone,
    "isGenPreco" boolean,
    "isConclusionAuto" boolean,
    "natureTraveauxEnvisage" text,
    "isEcartNorme" boolean NOT NULL,
    "isClasseurDTA" boolean NOT NULL,
    "isConforme2011" boolean NOT NULL,
    "isListeA" boolean NOT NULL,
    "isListeB" boolean NOT NULL,
    "isListeC" boolean NOT NULL,
    "ecartNorme" text,
    "contactDTA" character varying(255),
    "horairesDTA" text,
    "lieuDTA" text,
    "fonctionDetenteurDTA" character varying(100),
    "serviceDetenteurDTA" character varying(100),
    "isGenererPlan" boolean NOT NULL,
    "EtablissementDTA" character varying(50),
    "telModaliteDTA" character varying(50),
    "isGenererAnnexeZPSO" boolean,
    "isModeleN2017" boolean NOT NULL,
    "conclusionHAP" text,
    "isConclusionAutoHAP" boolean NOT NULL,
    "isModeNorme2017" boolean NOT NULL,
    "numEtapeIV" integer,
    "conformeIV" character varying(2),
    "justifChgtInter" text,
    "desordreIV" text
);


ALTER TABLE public."(ADN_DIAG) Amiante" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteComplNonInspecte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteComplNonInspecte" (
    "idCompl" integer NOT NULL,
    "idMission" integer NOT NULL,
    commentaire text,
    justification text
);


ALTER TABLE public."(ADN_DIAG) AmianteComplNonInspecte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteElement" (
    "idAmianteElement" integer NOT NULL,
    "idAmianteLocal" integer,
    "lienDossierElement" text,
    "idCategorieElement" character varying(10),
    ordre integer,
    numero character varying(50),
    "nomElement" character varying(255),
    "nomSousElement" character varying(100),
    substrat character varying(255),
    revetement character varying(255),
    zone text,
    "typeCFA" character varying(2),
    "categorieAmiante" character varying(255),
    couleur character varying(50),
    "couleurHexa" character varying(10),
    presence character varying(50),
    "etatDeConservation" character varying(50),
    preconisation character varying(50),
    "isZoneHomogene" boolean NOT NULL,
    "idPrelevement" integer,
    "commentairePrelev" text,
    "isGrilleEval" boolean NOT NULL,
    "isProtectionEtanche" boolean,
    "isProtection" boolean,
    "etatSurface" integer,
    "circulationAir" integer,
    chocs integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "isVisite" boolean,
    "justificationNV" text,
    "justificationNP" text,
    "IsIncludeRecap" boolean,
    "isPrelevement" boolean,
    liste character varying(5),
    "isHCI" boolean NOT NULL,
    "typeGE" character varying(2),
    "critereDecision" character varying(1),
    "etendueDegration" integer,
    "risqueDegEnv" integer,
    longueur double precision,
    "typeLongueur" character varying(5),
    "customField1" character varying(255),
    "customFieldMateriau" character varying(255),
    "numMesure" integer,
    surface double precision,
    "numGE" integer,
    "idZPSO" uuid,
    "isTemoinZPSO" boolean NOT NULL,
    "isResultatAuto" boolean,
    "aspectElement" character varying(100),
    "fonctionElement" character varying(100),
    epaisseur double precision,
    "referenceFabriquant" character varying(100),
    "modeleFabriquant" character varying(100),
    "numSerie" character varying(100),
    "periodeMiseEnOeuvre" character varying(100),
    "descriptifCouches" text,
    "isSondage" boolean NOT NULL,
    "materielSondage" text,
    "referenceSondage" character varying(50),
    "methodeSondage" text,
    "localisationSondage" character varying(500),
    "idRCBElement" uuid,
    "idRCBSondage" uuid,
    "idPRItem" uuid,
    "idResPhotoSondage" uuid,
    "previewDataPhotoSondage" bytea,
    "titrePhotoSondage" character varying(50),
    largeur double precision,
    "caracteristiqueMateriau" character varying(50),
    "codeExterne" character varying(100),
    latitude numeric(18,15),
    longitude numeric(18,15),
    "isResultatAutoHAP" boolean,
    "conclusionHAP" character varying(500),
    recommandation character varying(50),
    "critereDecisionHAP" character varying(50),
    "natureTrav" character varying(255),
    "delaiAvTravTxt" character varying(50),
    "delaiAvTravNum" integer,
    "moyenAccesNV" text,
    "justifCritereDecision" text,
    "critereDecisionIV" character varying(3),
    "classeIV" character varying(2),
    "conformeIV" character varying(2),
    "remarqueIV" text,
    "remarqueValiderIV" boolean,
    quantite double precision,
    unite character varying(5),
    poids double precision,
    "detailQuantif" text,
    "idEnumPRItem" integer,
    "numMPCA" integer,
    "reperePlan" character varying(255),
    "isPollue" boolean,
    "isEncapsulage" boolean,
    "keyFractionmtIV" character varying(5),
    "idExterne" character varying(50),
    "referenceZH" character varying(50),
    "intituleZH" character varying(255),
    "idA360" integer,
    "codePCA360" character varying(500)
);


ALTER TABLE public."(ADN_DIAG) AmianteElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteElementHisto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteElementHisto" (
    "idElementHisto" integer NOT NULL,
    "idLocalHisto" integer,
    ordre integer,
    numero character varying(50),
    "nomElement" character varying(255),
    "nomSousElement" character varying(100),
    substrat character varying(255),
    revetement character varying(255),
    zone text,
    presence character varying(50),
    "etatDeConservation" character varying(50),
    preconisation character varying(50),
    liste character varying(5),
    travaux text,
    "dateTravaux" timestamp without time zone,
    "societeTravaux" character varying(255),
    "resultatEmp" text,
    commentaire text,
    "idCategorieElement" character varying(10),
    "dateFinTravaux" timestamp without time zone,
    "categorieAmiante" character varying(255),
    "customField1" character varying(255),
    "customFieldMateriau" character varying(255),
    longeur double precision,
    "numMesure" integer,
    surface double precision,
    "numMPCA" integer,
    "reperePlan" character varying(255),
    "etatDegradation" character varying(50),
    "codeExterne" character varying(100),
    "idExterne" character varying(50),
    "isHCI" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) AmianteElementHisto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteLocal" (
    "idAmianteLocal" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idDossierLocal" uuid,
    ordre integer,
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    justification text,
    commentaire text,
    travaux character varying(50),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "pieceConcerne" character varying(50),
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50),
    "isPieceHumide" boolean NOT NULL,
    zone character varying(255),
    "moyenAccesNV" text,
    "remarqueIV" text,
    "remarqueValiderIV" boolean,
    "identificationZoneIV" character varying(500),
    "conformeIV" character varying(2),
    "surfaceIV" real,
    "isPollue" boolean,
    "keyBati" character varying(5),
    "codeExterne" character varying(100),
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) AmianteLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteLocalHisto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteLocalHisto" (
    "idLocalHisto" integer NOT NULL,
    "idRapportHisto" integer NOT NULL,
    ordre integer,
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    justification text,
    commentaire text,
    "numeroLot" character varying(50),
    "codeExterne" character varying(100),
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) AmianteLocalHisto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmiantePRItem; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmiantePRItem" (
    "idPRItem" uuid NOT NULL,
    "idMission" integer NOT NULL,
    "idEnumAmiantePR" integer,
    "codePRItem" character varying(50),
    "codeClass" character varying(10),
    "intituleClassNiv1Perso" character varying(255),
    "intituleClassNiv2Perso" character varying(255),
    intitule character varying(255),
    "itemType" character varying(1),
    ordre integer,
    commentaire text,
    "elementDefault" character varying(255),
    "substratDefault" character varying(255),
    "isPresence" boolean,
    "keyFractionmtIV" character varying(5),
    "isEncapsulageIV" boolean,
    "SzoneIV" double precision,
    "NbsecteurIV" integer,
    "sousElementDefault" character varying(255),
    "intituleClassNiv3Perso" character varying(255),
    "intituleClassNiv4Perso" character varying(255),
    "codePCA360" character varying(500)
);


ALTER TABLE public."(ADN_DIAG) AmiantePRItem" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteParam" (
    "idAmianteParam" integer NOT NULL,
    "idLaboDefaut" integer,
    "isGenTabAPSODef" boolean,
    "isGenColAPSODef" boolean,
    "isGenObligPropDef" boolean,
    "isGenAttestCompDef" boolean,
    "isGenTabRevDef" boolean,
    "isGenCertifDef" boolean,
    "isGenSeparationC5" boolean,
    "croquisBuilderPastilleElem" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isGenPreco" boolean,
    "isFusionMurs" boolean NOT NULL,
    "isConclusionAuto" boolean NOT NULL,
    "isAnnexe5" boolean NOT NULL,
    "isGenClasseurDTADef" boolean NOT NULL,
    "isConforme2011" boolean NOT NULL,
    "isGenererPlanDefaut" boolean NOT NULL,
    "modeUseCartouche" character varying(10),
    "croquisBuilderToolElem" integer,
    "croquisBuilderLogoElem" character varying(50),
    "croquisBuilderToolSongage" integer,
    "croquisBuilderLogoSondage" character varying(50),
    "croquisBuilderPastilleSongage" text,
    "croquisBuilderToolPrelev" integer,
    "croquisBuilderLogoPrelev" character varying(50),
    "croquisBuilderPastillePrelev" text,
    "isGenererAttestAccreditation" boolean,
    "isAfficherAttDimHorsSondage" boolean NOT NULL,
    "idNormeDefaut" integer,
    "isModeNorme2017Defaut" boolean NOT NULL,
    "croquisBuilderPastilleSecteurIV" text,
    "croquisBuilderPastilleElemIV" text,
    "croquisBuilderToolElemIV" integer,
    "croquisBuilderLogoElemIV" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) AmianteParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteRapportHisto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteRapportHisto" (
    "idRapportHisto" integer NOT NULL,
    "idMission" integer NOT NULL,
    "dateRapport" timestamp without time zone,
    reference character varying(255),
    societe character varying(255),
    objet text,
    conclusion text,
    intervenant character varying(255),
    "isListeA" boolean NOT NULL,
    "isListeB" boolean NOT NULL,
    "reperageAutre" text,
    presence character varying(50),
    "dateVisite" timestamp without time zone,
    "numAnnexe" integer,
    "nbPage" integer,
    "referenceExt" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) AmianteRapportHisto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) AmianteZPSO; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) AmianteZPSO" (
    "idZPSO" uuid NOT NULL,
    "idMission" integer NOT NULL,
    reference character varying(100),
    "isZPSOContinue" boolean NOT NULL,
    "nomElement" character varying(100),
    "nomSousElement" character varying(100),
    substrat character varying(100),
    revetement character varying(100),
    "conditionsSondage" text,
    "conditionsPrelev" text,
    "justificatifChoixPrelev" text,
    intitule character varying(255),
    "idPRItem" uuid
);


ALTER TABLE public."(ADN_DIAG) AmianteZPSO" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIB; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIB" (
    "idMission" integer NOT NULL,
    modele character varying(255),
    "nbPiece" integer,
    "nbNiveauHab" character varying(50),
    "typeBail" character varying(255),
    "dureeBail" character varying(255),
    "nbChambre" character varying(50),
    "nbSdb" character varying(50),
    prix character varying(50),
    loyer character varying(50),
    charges character varying(255),
    "depotGarantie" character varying(255),
    "taxeFonciere" character varying(50),
    "taxeHab" character varying(50),
    libelle1 character varying(50),
    libelle2 character varying(50),
    libelle3 character varying(50),
    valeur1 character varying(255),
    valeur2 character varying(255),
    valeur3 character varying(255),
    "isGenAnnexe" boolean,
    "isGenImgOuiNon" boolean,
    "isGenDPE" boolean,
    "isGenImage" boolean,
    "isGenDPESimple" boolean,
    "DateDispo" timestamp without time zone,
    "DPEConso" double precision,
    "DPEEmission" double precision,
    "DPETypeDossier" character varying(5),
    "jeuMatrice" character varying(100),
    "nomMatrice" character varying(100),
    observations text
);


ALTER TABLE public."(ADN_DIAG) CIB" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIBAnnexe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIBAnnexe" (
    "idAnnexe" integer NOT NULL,
    numero character varying(50),
    nom character varying(255),
    etage character varying(255),
    detail character varying(255),
    "idMission" integer
);


ALTER TABLE public."(ADN_DIAG) CIBAnnexe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIBEquipement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIBEquipement" (
    "idEquipement" integer NOT NULL,
    "idMission" integer NOT NULL,
    categorie character varying(255),
    "isResultOuiNon" boolean,
    "isEquipImm" boolean,
    libelle character varying(50),
    valeur character varying(255),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) CIBEquipement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIBLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIBLocal" (
    "idCIBLocal" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idDossierLocal" uuid,
    ordre integer,
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    surface real,
    "surfaceCarrez" real,
    "surfaceHorsCarrez" real,
    "HSP" real,
    "typePiece" character varying(50),
    "numLot" character varying(255),
    placard boolean,
    "typeSol" character varying(255),
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) CIBLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIBParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIBParam" (
    "idCIBParam" integer NOT NULL,
    "isGenAnnexe" boolean,
    "isGenImgOuiNon" boolean,
    "isGenDPE" boolean,
    "isGenImage" boolean,
    "comDefaut" text,
    "InsertTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CIBParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CIBValorisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CIBValorisation" (
    "idValorisation" integer NOT NULL,
    "idMission" integer NOT NULL,
    libelle character varying(50),
    "typeCom" character varying(50),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) CIBValorisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLH; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLH" (
    "idMission" integer NOT NULL,
    "NomEtablissement" character varying(500),
    "RaisonSociale" character varying(500),
    "numeroSiret" character varying(255),
    "numVoie" character varying(50),
    "cptNumVoie" character varying(10),
    "typeVoie" character varying(10),
    "nomVoie" character varying(100),
    "cptAdresse" character varying(100),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "telephoneFixe" character varying(50),
    "telephoneIP" character varying(50),
    "telephoneMobile" character varying(50),
    fax character varying(50),
    email character varying(255),
    "siteWeb" character varying(255),
    "titreResponsable" character varying(50),
    "nomResponsable" character varying(100),
    "prenomResponsable" character varying(50),
    "categorieActuelle" character varying(10),
    "categorieCible" character varying(10),
    "isContreVisite" boolean NOT NULL,
    "isFavorable" boolean,
    "justificationResultat" text,
    "justificationAutre" text,
    "isSousTraitance" boolean NOT NULL,
    "motifSousTraitance" text,
    "typeSousTraitanceInterne" character varying(10),
    "typeSousTraitanceExterne" character varying(10),
    "nomSousTraitant" character varying(500),
    "isAutomatismesPrerequis" boolean,
    "isAutomatismesPtCtrl" boolean,
    "isVisiteMistere" boolean,
    "dateSejourMistere" timestamp without time zone,
    "isGenererDocAnnexe" boolean,
    "isGenererDocPtCtrl" boolean,
    "isGenererAttestation" boolean,
    "isGenererGrillePtCtrl" boolean
);


ALTER TABLE public."(ADN_DIAG) CLH" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHDocPointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHDocPointControl" (
    "idDocument" integer NOT NULL,
    "idPtCtrl" integer NOT NULL,
    "idRes" uuid,
    "previewData" bytea,
    titre character varying(255),
    commentaire text,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) CLHDocPointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHEchantillonnage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHEchantillonnage" (
    "idEchantionnage" integer NOT NULL,
    "idMission" integer NOT NULL,
    "discriminantZone" character varying(10) NOT NULL,
    "nbTotal" integer,
    "nbAControler" integer,
    "nbEffectue" integer,
    justification text
);


ALTER TABLE public."(ADN_DIAG) CLHEchantillonnage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHParamResultat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHParamResultat" (
    "idParamResultat" integer NOT NULL,
    "idTypeMission" character varying(50),
    "categorieCible" character varying(10),
    "nbPointsObligatoires" integer,
    "nbPointsOptionnels" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHParamResultat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHPointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHPointControl" (
    "idPtCtrl" integer NOT NULL,
    "idEnumPtCtrl" integer NOT NULL,
    categorie character varying(10) NOT NULL,
    "idMission" integer NOT NULL,
    "discriminantZone" character varying(10),
    "capaciteZone" real,
    type character varying(5),
    "isTypeAuto" boolean,
    resultat integer,
    "isResultatAuto" boolean,
    "nbPointsResultat" integer,
    "isPropreteAuto" boolean,
    "propreteAvg" real,
    "isEtatAuto" boolean,
    "etatAvg" real,
    "surfaceRelevee" real,
    commentaire text,
    justification text,
    date timestamp without time zone,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) CLHPointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHPrerequis; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHPrerequis" (
    "idPrerequis" integer NOT NULL,
    "discriminantPrerequis" character varying(15) NOT NULL,
    "idMission" integer NOT NULL,
    "discriminantZone" character varying(10),
    "idZone" integer,
    "nombreItems" integer,
    "valeurNum" real,
    "valeurTxt" text,
    ordre integer,
    "isConformeDeclaration" boolean NOT NULL,
    "isAuto" boolean
);


ALTER TABLE public."(ADN_DIAG) CLHPrerequis" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHReglesEchantillonnage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHReglesEchantillonnage" (
    "idRegle" integer NOT NULL,
    "idTypeMission" character varying(50),
    "discriminantZone" character varying(10) NOT NULL,
    "nbTotal" integer,
    "nbTotalMax" integer,
    "nbAControler" integer,
    "isPourCent" boolean,
    "pourCentDuTotalAControler" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHReglesEchantillonnage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHRelEnumPointControlAuto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHRelEnumPointControlAuto" (
    "idRelPtCtrl" integer NOT NULL,
    "idEnumPtCtrl2" integer,
    categorie2 character varying(10),
    "idEnumPtCtrl1" integer,
    categorie1 character varying(10),
    "resultatPtCtrl1Exige" integer,
    "discriminantPrerequis" character varying(15),
    "valeurPrerequisExige" real,
    "valeurPrerequisExigeMax" real,
    "resultatAuto" integer,
    "nbPointsAuto" integer,
    "typeAuto" character varying(5),
    "precision" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHRelEnumPointControlAuto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHRelEnumPointControlNorme; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHRelEnumPointControlNorme" (
    "idRelEnumCLHPointControlNorme" integer NOT NULL,
    "idEnumPtCtrl" integer NOT NULL,
    "idNorme" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHRelEnumPointControlNorme" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHRelEnumPrerequis; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHRelEnumPrerequis" (
    "idRelPrerequis" integer NOT NULL,
    "discriminantPrerequis1" character varying(15) NOT NULL,
    "valeurPrerequis1" real,
    "valeurPrerequis1Max" real,
    "discriminantPrerequis2" character varying(15) NOT NULL,
    "categorieCible" character varying(10),
    "isAfficherPrerequis2" boolean NOT NULL,
    "isAddPrerequis1ToPrerequis2" boolean NOT NULL,
    "valeurAutoPrerequis2" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHRelEnumPrerequis" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHRelEnumPrerequisCalculable; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHRelEnumPrerequisCalculable" (
    "idRelPrerequis" integer NOT NULL,
    "prerequisAutomatisant1" character varying(15) NOT NULL,
    "prerequisAutomatisant2" character varying(15),
    "valeurConstante" real,
    "prerequisAuto" character varying(15) NOT NULL,
    "categorieCible" character varying(10),
    action character varying(5),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CLHRelEnumPrerequisCalculable" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CLHZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CLHZone" (
    "idZone" integer NOT NULL,
    "discriminantZone" character varying(10) NOT NULL,
    "idMission" integer NOT NULL,
    "idGroupePrerequis" integer,
    "idGroupePtCtrl" integer,
    nombre integer,
    capacite real,
    "categorieZone" character varying(50),
    intitule character varying(255),
    "intituleInterne" character varying(255),
    surface real,
    largeur real,
    longueur real,
    localisation character varying(100),
    etat real,
    proprete real,
    "typeSejour" character varying(50),
    "isVisite" boolean NOT NULL,
    "justificationNvisite" text,
    "dateVisite" timestamp without time zone,
    "isConformeDeclaration" boolean,
    "justificationNConforme" text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(255),
    "idZoneParent" integer,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) CLHZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Carrez; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Carrez" (
    "idMission" integer NOT NULL,
    "totalCarrez" real,
    "totalHorsCarrez" real,
    "isSeparationTypeSurface" boolean NOT NULL,
    "isGenererJustificationsHc" boolean NOT NULL,
    "isGenererCommentaires" boolean NOT NULL,
    "isGenererAnnexe" boolean NOT NULL,
    "idResMemoVocal" uuid,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) Carrez" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CarrezForme; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CarrezForme" (
    "idForme" integer NOT NULL,
    "idLocal" integer,
    nom character varying(100),
    "typeForme" character varying(32),
    "typeSurface" character varying(1),
    nombre smallint,
    surface real,
    jsd character varying(255),
    "idFormeParente" integer
);


ALTER TABLE public."(ADN_DIAG) CarrezForme" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CarrezLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CarrezLocal" (
    "idCarrezLocal" integer NOT NULL,
    "idMission" integer,
    "idDossierLocal" uuid,
    "typeLocal" character varying(2),
    ordre integer,
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "surfaceCarrez" real,
    "surfaceHorsCarrez" real,
    "surfaceNPC" real,
    commentaire text,
    hsp real,
    "titrePhoto" character varying(50),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "idResMemoVocal" uuid,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50),
    "moyenAccesNV" text,
    "isVisite" boolean,
    justification text
);


ALTER TABLE public."(ADN_DIAG) CarrezLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CarrezParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CarrezParam" (
    "idCarrezParam" integer NOT NULL,
    "isSeparationTypeSurface" boolean,
    "isGenererJustificationsHc" boolean,
    "isGenererCommentaires" boolean,
    "isGenererAnnexe" boolean,
    "isGenererHc" boolean,
    "croquisBuilderPastilleLocal" text,
    "croquisBuilderPastilleC" text,
    "croquisBuilderPastilleHC" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) CarrezParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) CarrezSegment; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) CarrezSegment" (
    "idSegment" integer NOT NULL,
    "discSegment" character varying(5),
    "idForme" integer,
    x1 real,
    y1 real,
    x2 real,
    y2 real,
    dimension real,
    rang integer
);


ALTER TABLE public."(ADN_DIAG) CarrezSegment" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ClassificationGeneric; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ClassificationGeneric" (
    code character varying(10) NOT NULL,
    "codeParent" character varying(10),
    "discClassGeneric" character varying(10),
    intitule character varying(255),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isTabGroup" boolean NOT NULL,
    "indiceLegende" integer
);


ALTER TABLE public."(ADN_DIAG) ClassificationGeneric" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPE" (
    "idMission" integer NOT NULL,
    "idTypeDossierDPE" character varying(5),
    "RELDTLIMM_idDossierDPE" integer,
    "RELDTLLOG_idDossierDPE" integer,
    "dateVisite" timestamp without time zone,
    "dateEtablissementDiagnostic" timestamp without time zone,
    "dateValidite" timestamp without time zone,
    "diagnostiqueurNom" character varying(50),
    "diagnostiqueurPrenom" character varying(50),
    "typeBatiment" character varying(50),
    "categorieBien" character varying(100),
    "addresseBien" character varying(50),
    methode character varying(30),
    "versionMethode" character varying(10),
    "datePrixEnergies" timestamp without time zone,
    commentaire text,
    "suiviDossierDPE" integer,
    "typeTransaction" integer,
    "isLocReleveDeConso" boolean,
    "locShBat" double precision,
    "locPeriodeReleveConsommation" character varying(100),
    "isLocEstimationALImmeuble" boolean NOT NULL,
    "isLocPourLogementRepresentatif" boolean NOT NULL,
    "locRatioLot" integer,
    "locRatioImmeuble" integer,
    "locIdDossierDpeParent" integer,
    "isNotIncludeDescriptifLot" boolean,
    "isGroupFactSansUsage" boolean NOT NULL,
    "partieBatERP" character varying(255),
    "typeGenerationDescLot" integer NOT NULL,
    "ChangeTime" timestamp without time zone,
    "isGenererEtiquette" boolean,
    "isGenererTextEtiquette" boolean,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "commentaireMurs" text,
    "commentaireFermetures" text,
    "commentairePlafondPlancher" text,
    "commentaireInstalElec" text,
    "commentaireVentilation" text,
    "isDPEplus" boolean,
    "commentaireENR" text,
    "idGroupeRecommandation" integer
);


ALTER TABLE public."(ADN_DIAG) DPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEAbonnementEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEAbonnementEnergie" (
    "idAbonnementEnergie" integer NOT NULL,
    "idPrixEnergie" integer,
    "ABONNEMENTGAZ_idPrixEnergie" integer,
    "prixAboElectrique" double precision,
    "prixAboGaz" double precision,
    "aboElectriqueIsCollectif" boolean,
    "aboGazIsCollectif" boolean,
    "valeurAboElec" double precision,
    "valeurAboGaz" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEAbonnementEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEAssocDetailEnvMateriauxThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEAssocDetailEnvMateriauxThBat" (
    "idAssocDetailEnvMateriauxThBat" integer NOT NULL,
    "idDetailEnveloppe" integer,
    libelle character varying(255),
    lambda double precision,
    epaisseur double precision,
    "isPourR" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEAssocDetailEnvMateriauxThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEBatiment; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEBatiment" (
    "idBatiment" integer NOT NULL,
    "idSaisieLot" integer,
    nom character varying(255),
    shon double precision,
    surface double precision
);


ALTER TABLE public."(ADN_DIAG) DPEBatiment" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEBatimentLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEBatimentLot" (
    "idLot" integer NOT NULL,
    "idBatiment" integer,
    nom character varying(255),
    surface double precision,
    "surfaceHaut" double precision,
    "surfaceBas" double precision,
    "surfaceVerticale" double precision,
    "isDPE" boolean
);


ALTER TABLE public."(ADN_DIAG) DPEBatimentLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEClasseConsommationEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEClasseConsommationEnergie" (
    "idClasseConsommationEnergie" integer NOT NULL,
    "classConso_A" integer NOT NULL,
    "classConso_B" integer NOT NULL,
    "classConso_C" integer NOT NULL,
    "classConso_D" integer NOT NULL,
    "classConso_E" integer NOT NULL,
    "classConso_F" integer NOT NULL,
    "classConso_G" integer NOT NULL,
    "classConso_H" integer NOT NULL,
    "classConso_I" integer NOT NULL,
    "imgConso_A" bytea,
    "imgConso_B" bytea,
    "imgConso_C" bytea,
    "imgConso_D" bytea,
    "imgConso_E" bytea,
    "imgConso_F" bytea,
    "imgConso_G" bytea,
    "imgConso_H" bytea,
    "imgConso_I" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEClasseConsommationEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEClasseEmissionGES; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEClasseEmissionGES" (
    "idClasseEmissionGES" integer NOT NULL,
    "classEmission_A" integer NOT NULL,
    "classEmission_B" integer NOT NULL,
    "classEmission_C" integer NOT NULL,
    "classEmission_D" integer NOT NULL,
    "classEmission_E" integer NOT NULL,
    "classEmission_F" integer NOT NULL,
    "classEmission_G" integer NOT NULL,
    "classEmission_H" integer NOT NULL,
    "classEmission_I" integer NOT NULL,
    "imgEmission_A" bytea,
    "imgEmission_B" bytea,
    "imgEmission_C" bytea,
    "imgEmission_D" bytea,
    "imgEmission_E" bytea,
    "imgEmission_F" bytea,
    "imgEmission_G" bytea,
    "imgEmission_H" bytea,
    "imgEmission_I" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEClasseEmissionGES" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECoeffKpbmRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECoeffKpbmRconnu" (
    "idCoeffKpbmRconnu" integer NOT NULL,
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    kpbm double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPECoeffKpbmRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECoeffKtpmeRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECoeffKtpmeRconnu" (
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    ktpme double precision NOT NULL,
    "idCoeffKtpmeRconnu" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPECoeffKtpmeRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECoeffLineiqueRefendMurExterieur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECoeffLineiqueRefendMurExterieur" (
    "idCoeffLineiqueRefendMurExterieur" integer NOT NULL,
    "idEnumereConfiguration" integer,
    "idTypeNiveau" integer,
    "Lrem" double precision NOT NULL,
    "minSurface" integer NOT NULL,
    "maxSurface" integer NOT NULL,
    "NIV" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPECoeffLineiqueRefendMurExterieur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECoeffbCirc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECoeffbCirc" (
    "idCoeffbCirc" integer NOT NULL,
    "isIsole" boolean NOT NULL,
    "isCirculationCentrale" boolean NOT NULL,
    "haveSAS" boolean NOT NULL,
    "isRDC" boolean NOT NULL,
    b double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPECoeffbCirc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECompositionSaisieEnv; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECompositionSaisieEnv" (
    "idComposition" integer NOT NULL,
    "idDetailEnveloppe" integer,
    surface double precision,
    nb integer,
    orientation character varying(50),
    protection character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPECompositionSaisieEnv" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstante; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstante" (
    "idConstanteDPE" integer NOT NULL,
    "arretePrixEnergie" character varying(255) NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "PeoDefaut" double precision NOT NULL,
    "coeffPpv" double precision NOT NULL,
    "coeffPco" double precision NOT NULL,
    "retrancheUfenetreSaisie" double precision NOT NULL,
    "retrancheUfenetreVolet" double precision NOT NULL,
    "retrancheUfenetreArgon" double precision NOT NULL,
    "TVA_recommandation" double precision NOT NULL,
    "TVA_autre" double precision NOT NULL,
    "nomMethode" character varying(50) NOT NULL,
    "versionMethode" character varying(10) NOT NULL,
    "nbDigitsGeneration" integer,
    "coeffUfenLocNonChauffe" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision
);


ALTER TABLE public."(ADN_DIAG) DPEConstante" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstanteGenerique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstanteGenerique" (
    "KEY_constanteGenerique" character varying(30) NOT NULL,
    "intValue" integer,
    "doubleValue" double precision,
    "textValue" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEConstanteGenerique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstantePontThermiqueIC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstantePontThermiqueIC" (
    "idConstantePontThermiqueIC" integer NOT NULL,
    "kpbemeITISsChape" double precision NOT NULL,
    "kpbemeITESsChape" double precision NOT NULL,
    "kpbemeAutreSsChape" double precision NOT NULL,
    "kpbemeITIAutre" double precision NOT NULL,
    "kpbemeITEAutre" double precision NOT NULL,
    "kpbemeAutreAutre" double precision NOT NULL,
    "kpbimeITISsChape" double precision NOT NULL,
    "kpbimeITESsChape" double precision NOT NULL,
    "kpbimeAutreSsChape" double precision NOT NULL,
    "kpbimeITIAutre" double precision NOT NULL,
    "kpbimeITEAutre" double precision NOT NULL,
    "kpbimeAutreAutre" double precision NOT NULL,
    "ktpmeChapeFlottanteITI" double precision NOT NULL,
    "ktpmePRE1982" double precision NOT NULL,
    "ktpmePlancherBasIsole" double precision NOT NULL,
    "kttemeITI" double precision NOT NULL,
    "kttemeITE" double precision NOT NULL,
    "kttemeAutre" double precision NOT NULL,
    "kttimeITI" double precision NOT NULL,
    "kttimeITE" double precision NOT NULL,
    "kttimeAutre" double precision NOT NULL,
    "ktcmeITILourd" double precision NOT NULL,
    "ktcmeITELourd" double precision NOT NULL,
    "ktcmeAutreLourd" double precision NOT NULL,
    "ktcmeITILeger" double precision NOT NULL,
    "ktcmeITELeger" double precision NOT NULL,
    "ktcmeAutreLeger" double precision NOT NULL,
    "krfmeITI" double precision NOT NULL,
    "krfmeITE" double precision NOT NULL,
    "krfmeAutre" double precision NOT NULL,
    "Klnc" double precision NOT NULL,
    kpibme double precision NOT NULL,
    "kpibmeITIandRupteur" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEConstantePontThermiqueIC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstante_IC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstante_IC" (
    "idConstanteDPE_IC" integer NOT NULL,
    "Io" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "Rd1IsoleAeraulique" double precision NOT NULL,
    "Rd1IsoleHauteT" double precision NOT NULL,
    "Rd1IsoleBasseT" double precision NOT NULL,
    "Rd1Aeraulique" double precision NOT NULL,
    "Rd1HauteT" double precision NOT NULL,
    "Rd1BasseT" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "UmurIsoleLnc" double precision NOT NULL,
    "UmurLnc" double precision NOT NULL,
    "CORclimGaz" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEConstante_IC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstante_MI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstante_MI" (
    "idConstanteDPE_MI" integer NOT NULL,
    "IauxSolaire" double precision NOT NULL,
    "Io" double precision NOT NULL,
    "cteCOMPLLeger" double precision NOT NULL,
    "cteCOMPLLourd" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "aRApuitProvencal" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "COR_ClimGaz" double precision NOT NULL,
    "kmenITE" double precision NOT NULL,
    "kpimITIrupteur" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEConstante_MI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEConstantesPontThermiqueMI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEConstantesPontThermiqueMI" (
    "idConstantesPontThermiqueMI" integer NOT NULL,
    "kpbmVideSan" double precision NOT NULL,
    "kpbmVideSanITI" double precision NOT NULL,
    "kpbmChapeITI" double precision NOT NULL,
    "kpbmPre1982" double precision NOT NULL,
    "kpbmPre1982ITE" double precision NOT NULL,
    "kpbmPost1982" double precision NOT NULL,
    "kpbmPost1982ITE" double precision NOT NULL,
    "krfmITE" double precision NOT NULL,
    "krfmNonITE" double precision NOT NULL,
    krfpb double precision NOT NULL,
    "KpbmExt" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEConstantesPontThermiqueMI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPECotePiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPECotePiece" (
    "idCotePiece" integer NOT NULL,
    "idPieceSaisie" integer,
    "libelleCotePiece" character varying(50) NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPECotePiece" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailCalcul; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailCalcul" (
    "idSaisieLot" integer NOT NULL,
    "ENV" double precision,
    "DPmurs" double precision,
    "DPplafond" double precision,
    "DPplancher" double precision,
    "DPvitrage" double precision,
    "DPverandas" double precision,
    "DPportes" double precision,
    "aRA" double precision,
    "PT" double precision,
    "METEO" double precision,
    "INT_ermitence" double precision,
    "CLIMAT" double precision,
    "COMPL" double precision,
    "CchInd" double precision,
    "CchColl" double precision,
    "CecsInd" double precision,
    "CecsColl" double precision,
    "IauxInd" double precision,
    "IauxColl" double precision,
    "CauxInd" double precision,
    "CauxColl" double precision,
    "Bch" double precision,
    "Becs" double precision,
    "Smurs" double precision,
    "Stoit" double precision,
    "Splancher" double precision,
    "Svitrage" double precision,
    "Sverandas" double precision,
    "Sportes" double precision,
    "CchPCI" double precision,
    "CecsPCI" double precision,
    "CclimPCI" double precision,
    "CusagesRecensesPCI" double precision,
    "CauxPCI" double precision,
    "CauePCI" double precision,
    "CaugPCI" double precision,
    "CeclPCI" double precision,
    "CascenseurPCI" double precision,
    "CchEP" double precision,
    "CecsEP" double precision,
    "CclimEP" double precision,
    "CusagesRecensesEP" double precision,
    "CauxEP" double precision,
    "CaueEP" double precision,
    "CaugEP" double precision,
    "CeclEP" double precision,
    "CascenseurEP" double precision,
    "CchCO2" double precision,
    "CecsCO2" double precision,
    "CclimCO2" double precision,
    "CauxCO2" double precision,
    "CaueCO2" double precision,
    "CaugCO2" double precision,
    "CeclCO2" double precision,
    "CascenseurCO2" double precision,
    "Dch" double precision,
    "Decs" double precision,
    "Dclim" double precision,
    "DusagesRecenses" double precision,
    "Daux" double precision,
    "Decl" double precision,
    "Dascenseur" double precision,
    "Dtotal" double precision,
    "consommationAnnuelleEP" double precision,
    "consommationAnnuelleEPParm2" double precision,
    "emissionsGESAnnuelle" double precision,
    "emissionsGESAnnuelleParm2" double precision,
    "productionEnergieRenouvelableEP" double precision
);


ALTER TABLE public."(ADN_DIAG) DPEDetailCalcul" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailChauffage" (
    "idDetailChauffage" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idSaisieLot" integer,
    "idEnumereReseauDistribution" integer,
    "idInstallationEnergetique" integer,
    "descriptionChauffage" character varying(255),
    "plancherChauffantBasseT" boolean NOT NULL,
    "plafondChauffantBasseT" boolean NOT NULL,
    "emetteurBasseT" boolean NOT NULL,
    "presenceProgrammateur" boolean NOT NULL,
    "chauffageAeraulique" boolean NOT NULL,
    "robinetThermo" boolean,
    "reseauCollectifIsole" boolean,
    "Fch_saisie" double precision,
    "Ich" double precision,
    "IchBase" double precision,
    "surfaceChauffee" double precision,
    "libelleEnergie" character varying(30),
    "prix_kWh_ch" double precision,
    "isCollectif" boolean NOT NULL,
    "chauffageEauChaude" boolean,
    "statutSaisie" integer NOT NULL,
    "condenseurSurFumee" boolean NOT NULL,
    "depenseCh" double precision,
    "CchPCI" double precision,
    puissance character varying(50),
    rendement character varying(50),
    "dateFabrication" timestamp without time zone,
    "presenceAppoint" boolean,
    "A2" double precision,
    "hasInstallationSolaire" boolean,
    "inspectionSup15An" boolean,
    "isChaudiereCORch" boolean,
    emetteur character varying(255),
    "Rd" double precision,
    "Re" double precision,
    "Rg" double precision,
    "Rr" double precision,
    "isChaufferie" boolean,
    "hasCogeneration" boolean,
    "PcoSaisie" double precision,
    "PremierSysteme" boolean,
    "factureBoisDispo" boolean,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "nbEmetteur" integer,
    "idResEmetteur" uuid,
    "previewEmetteur" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailClimatisation" (
    "idDetailClimatisation" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereSystemeClimatisation" integer,
    "idEnumereIauxClimatisation" integer,
    "descriptionClimatisation" character varying(150),
    "libelleSysteme" character varying(50),
    "pourcentageSurfaceClim" double precision,
    "CclimEP" double precision,
    "libelleEnergie" character varying(30),
    "prix_kWh_clim" double precision,
    "statutSaisie" integer NOT NULL,
    "surfaceClimatisee" double precision,
    "surfaceClimatiseeDernierEtage" double precision,
    "idEnumereCombustible" integer,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailECS" (
    "idDetailECS" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereCombustible" integer,
    "idInstallationEnergetique" integer,
    "descriptionECS" character varying(255),
    "ecsSolaire" boolean NOT NULL,
    "ecsSolaireVieux" boolean NOT NULL,
    veilleuse boolean NOT NULL,
    "optionIecs1" boolean,
    "optionIecs2" boolean,
    "FecsSaisie" double precision,
    "Iecs" double precision,
    "IecsBase" double precision,
    "libelleEnergie" character varying(30),
    "prix_kWh_ecs" double precision,
    "isCollectif" boolean NOT NULL,
    "statutSaisie" integer NOT NULL,
    "depenseECS" double precision,
    "CecsPCI" double precision,
    puissance character varying(50),
    rendement character varying(50),
    "dateFabrication" timestamp without time zone,
    "inspectionSup15An" boolean,
    "Rs" double precision,
    "Rd" double precision,
    "Rg" double precision,
    "reseauIsole" boolean,
    "isGRS" boolean,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailEclairage" (
    "idDetailEclairage" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailEnergies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailEnergies" (
    "idDetailEnergies" integer NOT NULL,
    "idSaisieLot" integer,
    "presenceGazIndividuel" boolean NOT NULL,
    "gazCuisson" boolean NOT NULL,
    "presenceGPL" boolean NOT NULL,
    "citerneGPLLocation" boolean NOT NULL,
    "citerneGPLAchete" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailEnergies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailEnveloppe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailEnveloppe" (
    "idDetailEnveloppe" integer NOT NULL,
    "libelleDetailEnveloppe" character varying(50) NOT NULL,
    surface double precision,
    "U" double precision,
    "coeffCorrecteur" double precision,
    "surfaceSaisie" double precision,
    "Usaisie" double precision,
    "statutSaisie" integer NOT NULL,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailEnveloppe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailEquipementDivers" (
    "idDetailEquipementDivers" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailImmeuble" (
    "idMission" integer NOT NULL,
    "idEnumereCORPlafond" integer,
    "SHbat" double precision,
    "nbNiveaux" integer,
    "HSPmoyenne" double precision,
    "typeToiture" character varying(30),
    "SH_DernierEtage" double precision,
    "nbLogements" integer
);


ALTER TABLE public."(ADN_DIAG) DPEDetailImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailInformationLogement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailInformationLogement" (
    "idMission" integer NOT NULL,
    "idEnumerePlageAltitude" integer,
    "idEnumereConfigurationAppartement" integer,
    "idEnumereAnneeConstruction" integer,
    dpt character varying(2),
    "idEnumereMIT" integer,
    "idEnumereConfiguration" integer,
    "anneeConstruction" character varying(30),
    "hauteurSsPlafond" double precision,
    "altitudeSaisie" double precision,
    "vitrageSudEnsolleilles" boolean,
    "surfaceHabitable" double precision,
    "nombreNiveaux" double precision,
    "MIT" double precision,
    "FOR_me" double precision,
    "perimetreSaisie" double precision,
    "comblesHabite" boolean,
    "pourcentageSurfaceSol" double precision,
    "pourcentageSurfaceComble" double precision,
    "pourcentageSurfaceTerrasse" double precision,
    etage character varying(50),
    "isDernierEtage" boolean,
    sas boolean,
    "perimetreSurExterieurNiv2" double precision,
    "perimetreSurExterieurNiv1" double precision,
    "perimetreSurExterieurNiv3" double precision,
    "circulationCentrale" boolean,
    "perimetreSurPartiesCommunes" double precision,
    "chauffageCentralSansComptage" boolean,
    "presenceAscenseur" boolean,
    millieme integer,
    "milliemeBase" integer,
    "nbOccupants" character varying(50),
    "idResFaceSud" uuid,
    "previewFaceSud" bytea,
    "idResFaceNord" uuid,
    "previewFaceNord" bytea,
    "idResFaceEst" uuid,
    "previewFaceEst" bytea,
    "idResFaceOuest" uuid,
    "previewFaceOuest" bytea,
    commentaire text,
    "idResVentilation" uuid,
    "previewVentilation" bytea,
    "tempChaufJour" character varying(50),
    "tempChaufNuit" character varying(50),
    "nbJourInoccupeAvecChauf" integer,
    "nbJourInoccupeSansChauf" integer,
    "nbOccupant" integer,
    "utilisationECS" character varying(255),
    "utilisationEclairage" character varying(255),
    "presenceAmpouleEco" character varying(255),
    "idResEnvSud" uuid,
    "previewEnvSud" bytea,
    "idResEnvNord" uuid,
    "previewEnvNord" bytea,
    "idResEnvEst" uuid,
    "previewEnvEst" bytea,
    "idResEnvOuest" uuid,
    "previewEnvOuest" bytea,
    orientation1 character varying(255),
    orientation2 character varying(255),
    orientation3 character varying(255),
    orientation4 character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPEDetailInformationLogement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailNiveauImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailNiveauImmeuble" (
    "idDetailNiveauImmeuble" integer NOT NULL,
    "idMission" integer,
    "perimetreSurExterieur" double precision,
    "nbNiveauxIdentique" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailNiveauImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailPreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailPreconisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idSaisieLot" integer,
    "preconisationTexte" text,
    "coutMin" double precision,
    "coutMax" double precision,
    "creditImpot" double precision,
    "commentairePreconisation" text,
    "isAutoApplique" boolean,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPEDetailPreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvFenetre" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUfenetre" integer,
    "idSaisieLot" integer,
    "idSaisieVitrage" integer NOT NULL,
    "descriptionFenetre" character varying(150),
    "Ucalcul" double precision,
    "Ksaisie" double precision,
    "isFenetreToit" boolean NOT NULL,
    "isITE" boolean NOT NULL,
    "isLocalNonChauffe" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvMur" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUmurD" integer,
    "idSaisieIsolant" integer,
    "idEnumereUmurInconnu" integer,
    "idEnumereUmur0" integer,
    "idEnumereTypeMur" integer,
    "idSaisieLot" integer,
    "idEnumereCORmur" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITE" boolean NOT NULL,
    "ITI" boolean NOT NULL,
    "hasRupteur" boolean NOT NULL,
    "UsaisieContainsR" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPlafond" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumerCORPlafond" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplafond0" integer,
    "idEnumereUplafondInconnu" integer,
    "idEnumereUplafondD" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITI" boolean,
    "ITE" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPlancher" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplancherD" integer,
    "idEnumereUplancherInconnu" integer,
    "idEnumereUplancher0" integer,
    "idEnumereCORsol" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "isolationSsChape" boolean,
    "ITE" boolean,
    "ITI" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPorte" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereUporte" integer,
    "descriptionPorte" character varying(150),
    "donneSurLNC" boolean NOT NULL,
    "isIsole" boolean NOT NULL,
    "hasSAS" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieEnvVeranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieEnvVeranda" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUveranda" integer,
    "idSaisieVitrage" integer NOT NULL,
    "idSaisieLot" integer,
    "descriptionVeranda" character varying(150),
    "Ucalcul" double precision,
    "Ksaisie" double precision
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieEnvVeranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSaisieFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSaisieFacture" (
    "idDetailSaisieFacture" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idGroupementFacture" integer,
    "idTypeEnergie" integer,
    "refDocument" character varying(50),
    "typeDocument" character varying(50),
    "depenseFacture" double precision,
    "quantiteEnergie" double precision,
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "dureeMois" double precision,
    "dateFacture" timestamp without time zone,
    "statutSaisie" integer,
    "isCollectif" boolean,
    "dateFinFacture" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSaisieFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailSourceEnergie" (
    "idDetailSourceEnergie" integer NOT NULL,
    "idSaisieLot" integer,
    "idDetailChauffage" integer,
    "presenceCapteurSolaire" boolean NOT NULL,
    "PpvSaisie" double precision,
    "Spv" double precision,
    "presenceEolienne" boolean NOT NULL,
    "PeoSaisie" double precision,
    "presencePuitCanadien" boolean NOT NULL,
    "presenceCogeneration" boolean NOT NULL,
    "PcoSaisie" double precision,
    "Pautre" double precision,
    "statutSaisie" integer NOT NULL,
    "isVendu" boolean,
    "idTypeEnergie" integer,
    "idResSolaire" uuid,
    "previewSolaire" bytea,
    "idResEolienne" uuid,
    "previewEolienne" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailUsageRecense; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailUsageRecense" (
    "idDetailUsageRecense" integer NOT NULL,
    "idSaisieLot" integer,
    libelle character varying(150),
    "KEYusage" integer,
    "byUniteByEnergie" text,
    "efByEnergie" text,
    "ConsommationEP" double precision,
    "ConsommationPCI" double precision,
    "EmissionCO2" double precision,
    "Depense" double precision,
    "typeDetail" integer NOT NULL,
    "keyEnergie" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) DPEDetailUsageRecense" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDetailVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDetailVentilation" (
    "idDetailVentilation" integer NOT NULL,
    "idEnumereVentilation" integer,
    "idSaisieLot" integer,
    "idTypeVentilation" integer,
    "descriptionVentilation" character varying(100),
    "aRA" double precision,
    "statutSaisie" integer NOT NULL,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) DPEDetailVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEDptClimat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEDptClimat" (
    dpt character varying(2) NOT NULL,
    "idZoneHiver" character varying(2),
    "idZoneEte" character varying(2),
    "libelleDpt" character varying(50) NOT NULL,
    "altMin" integer NOT NULL,
    "altMax" integer NOT NULL,
    "Nref" integer NOT NULL,
    "Dhref" integer NOT NULL,
    "Pref" integer NOT NULL,
    "C3" double precision,
    "C4" integer,
    "tExtDeBase" smallint NOT NULL,
    "E" double precision NOT NULL,
    "Fch" double precision NOT NULL,
    "FecsAncienneMI" real NOT NULL,
    "FecsRecenteMI" real NOT NULL,
    "FecsSolaireMI" real NOT NULL,
    "FecsAncienneIC" real NOT NULL,
    "FecsRecenteIC" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEDptClimat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEGroupementFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEGroupementFacture" (
    "idGroupementFacture" integer NOT NULL,
    "idTypeEnergie" integer,
    "idSaisieLot" integer,
    "idEnumereCombustible" integer,
    "libelleGroupement" character varying(100),
    "typeGroupement" character varying(50),
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "isCollectif" boolean,
    millieme integer,
    "milliemeBase" integer,
    "keyUsage" integer
);


ALTER TABLE public."(ADN_DIAG) DPEGroupementFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEHspValue; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEHspValue" (
    "idDPEHspValue" integer NOT NULL,
    "idMission" integer,
    surface double precision,
    hauteur double precision
);


ALTER TABLE public."(ADN_DIAG) DPEHspValue" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPELocQteEfImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPELocQteEfImmeuble" (
    "idLocQteEfImmeuble" integer NOT NULL,
    "idTypeEnergie" integer,
    "idMission" integer,
    "idEnumereCombustible" integer,
    "KEYusage" integer,
    "ConsoEf" double precision,
    "ratioLot" integer,
    "ratioImmeuble" integer
);


ALTER TABLE public."(ADN_DIAG) DPELocQteEfImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPELocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPELocal" (
    "idPieceSaisie" integer NOT NULL,
    "idSaisieLot" integer,
    "idDossierLocal" uuid,
    "libellePiece" character varying(100) NOT NULL,
    "libelleEtage" character varying(50),
    "numeroPiece" character varying(50),
    ordre integer,
    niveau real,
    code character varying(5),
    "isVisite" character varying(255),
    justification character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPELocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPELotBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPELotBaie" (
    "idBaie" integer NOT NULL,
    "idLot" integer,
    nom character varying(255),
    surface double precision,
    orientation integer
);


ALTER TABLE public."(ADN_DIAG) DPELotBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPELotSurface; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPELotSurface" (
    "idSurface" integer NOT NULL,
    "idLot" integer,
    type character varying(50),
    "typeEnergie" character varying(50),
    surface double precision
);


ALTER TABLE public."(ADN_DIAG) DPELotSurface" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGBienIndividuel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGBienIndividuel" (
    "idBien" integer NOT NULL,
    "idDossier" integer,
    "idGroupe" integer,
    groupe character varying(255),
    nom character varying(50),
    ville character varying(255),
    cp character varying(50),
    local character varying(255),
    rue character varying(255),
    type character varying(255),
    usage character varying(255),
    surface real,
    "dateConstruction" character varying(50),
    "dateRehab" character varying(50),
    plafond boolean,
    plancher boolean,
    mur boolean,
    batiment character varying(100),
    escalier character varying(100),
    etage character varying(80),
    porte character varying(100),
    "nLot" character varying(50),
    "idLot" integer,
    "resElec" double precision,
    "hasPco" boolean,
    "hasSol" boolean,
    "hasEol" boolean,
    "refADEME" character varying(50),
    "refTempADEME" character varying(50),
    "chWord" character varying(255),
    "chPDF" character varying(255),
    "consoNrj" double precision,
    "consoGes" double precision,
    "typeErrGen" integer,
    "typeErrTrans" integer,
    "msgErrGen" character varying(1000),
    "msgErrTrans" character varying(1000),
    "numDossierLot" integer,
    "refExterneDossierLot" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPEMGBienIndividuel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGDossier" (
    "idDossier" integer NOT NULL,
    dossier character varying(255),
    "dateDossier" timestamp without time zone,
    "fichierXLS" character varying(255),
    "isLoc" boolean NOT NULL,
    "isNeuf" boolean NOT NULL,
    "isAn8" boolean NOT NULL,
    is2012 boolean,
    "idSociete" character varying(50),
    "idSiteGestion" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) DPEMGDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGGroupe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGGroupe" (
    "idGroupe" integer NOT NULL,
    "idDossier" integer,
    groupe character varying(255),
    "idDossierADN" integer,
    "idDPE" integer,
    reference character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DPEMGGroupe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGListeSimulation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGListeSimulation" (
    "idSimu" integer NOT NULL,
    "idBien" integer,
    "idDPE" integer,
    "idSaisieLot" integer,
    "nomSimu" character varying(255),
    "isGenerer" boolean
);


ALTER TABLE public."(ADN_DIAG) DPEMGListeSimulation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGMappageXLS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGMappageXLS" (
    "idMap" integer NOT NULL,
    "idType" integer,
    groupe character varying(5),
    nom character varying(5),
    ville character varying(5),
    cp character varying(5),
    local character varying(5),
    rue character varying(5),
    type character varying(5),
    usage character varying(5),
    surface character varying(5),
    "dateConstruction" character varying(5),
    "dateRehab" character varying(5),
    plafond character varying(5),
    plancher character varying(5),
    mur character varying(5),
    batiment character varying(100),
    escalier character varying(100),
    etage character varying(80),
    porte character varying(100),
    "nLot" character varying(50),
    "resElec" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "numDossier" character varying(5),
    "refExterne" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) DPEMGMappageXLS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGParamGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGParamGeneral" (
    "idGen" integer NOT NULL,
    rnd integer,
    "typeGene" character varying(50),
    etiquette boolean,
    "texteEtiquette" boolean,
    "widthEtiquette" double precision,
    "heightEtiquette" double precision,
    "tantiemeResElec" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEMGParamGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMGTypeMappage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMGTypeMappage" (
    "idType" integer NOT NULL,
    nom character varying(50),
    defaut boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEMGTypeMappage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEMateriauThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEMateriauThBat" (
    "idMateriauThBat" integer NOT NULL,
    "MATERIAUPARENT_idMateriauThBat" integer,
    libelle character varying(255) NOT NULL,
    rho character varying(100),
    lambda double precision,
    commentaire text,
    "isIsolant" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEMateriauThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEParamGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEParamGeneral" (
    "idDPEParam" integer NOT NULL,
    "isCalculInvestissementAuto" boolean,
    "PrevisualisationResultat" boolean,
    "IntervalCalculPrevisualisation" integer,
    "PrendreCompteERpourFactures" boolean,
    "GenerationDescLot" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isGenererTextEtiquette" boolean,
    "isGenererEtiquette" boolean,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "pieChartMode" integer
);


ALTER TABLE public."(ADN_DIAG) DPEParamGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEParamUser; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEParamUser" (
    "idDPEParmUser" integer NOT NULL,
    "idEmploye" integer,
    "HideAlertSimulationObsolete" boolean,
    "HideAlertDossierVerouille" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEParamUser" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationChauffage" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailChauffage" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationClimatisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailClimatisation" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationECS" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailECS" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationEclairage" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEclairage" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationEquipementDivers" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEquipementDivers" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationFenetre" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationMur" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationPlafond" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationPlancher" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationPorte" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationSourceEnergie" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailSourceEnergie" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationVentilation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailVentilation" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPreconisationVeranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPreconisationVeranda" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG) DPEPreconisationVeranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEPrixEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEPrixEnergie" (
    "idPrixEnergie" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idTypeEnergie" integer,
    "libellePrixEnergie" character varying(100) NOT NULL,
    "prix_kWh" double precision NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "minConsommation" integer,
    "maxConsommation" integer,
    "tarifAbonnement" double precision,
    "simpleTarif" boolean NOT NULL,
    "doubleTarif" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision
);


ALTER TABLE public."(ADN_DIAG) DPEPrixEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEQuoiAmeliorer; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEQuoiAmeliorer" (
    "KEYQuoiAmelioer" character varying(10) NOT NULL,
    "sujetAmelioration" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEQuoiAmeliorer" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEReferentNotationElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEReferentNotationElement" (
    "idReferentNotationElementDPE" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    valeur1 double precision NOT NULL,
    valeur2 double precision NOT NULL,
    valeur3 double precision NOT NULL,
    valeur4 double precision NOT NULL,
    valeur5 double precision NOT NULL,
    valeur6 double precision NOT NULL,
    valeur7 double precision NOT NULL,
    valeur8 double precision NOT NULL,
    valeur9 double precision NOT NULL,
    valeur10 double precision NOT NULL,
    valeur11 double precision NOT NULL,
    valeur12 double precision NOT NULL,
    valeur13 double precision NOT NULL,
    valeur14 double precision NOT NULL,
    valeur15 double precision NOT NULL,
    valeur16 double precision NOT NULL,
    valeur17 double precision NOT NULL,
    valeur18 double precision NOT NULL,
    valeur19 double precision NOT NULL,
    valeur20 double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEReferentNotationElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPESaisieIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPESaisieIsolant" (
    "idSaisieIsolant" integer NOT NULL,
    "Risolant_saisie" double precision,
    "epaisseurIsolantSaisie" double precision,
    "anneeIsolationSaisie" character varying(30),
    "Ud" double precision
);


ALTER TABLE public."(ADN_DIAG) DPESaisieIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPESaisieLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPESaisieLot" (
    "idSaisieLot" integer NOT NULL,
    "idEnumereEffortInvestissement" integer,
    "RELETATINITETATPROJ_idSaisieLot" integer,
    "idAbonnementEnergie" integer,
    "idEnumereRetourInvestissement" integer,
    "idMission" integer,
    "idEnumereEconomies" integer,
    "RELDTLCALCUL_idSaisieLot" integer,
    "libelleSaisieLot" character varying(255) NOT NULL,
    consommation double precision,
    "effortInvestissement" integer,
    "retourInvestissement" integer,
    economies integer,
    "pourcentageCreditImpot" double precision,
    "isGenerer" boolean NOT NULL,
    "isActionImmediate" boolean NOT NULL,
    "isVirtuel" boolean
);


ALTER TABLE public."(ADN_DIAG) DPESaisieLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPESaisieVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPESaisieVitrage" (
    "idSaisieVitrage" integer NOT NULL,
    "epaisseurLameAir" character varying(20),
    argon boolean NOT NULL,
    volet boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPESaisieVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPESurfaceDeperditive; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPESurfaceDeperditive" (
    "idSurfaceDeperditive" integer NOT NULL,
    "idDetailEnveloppe" integer,
    "idCotePiece" integer,
    "surfaceSaisie" double precision NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DPESurfaceDeperditive" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPETypeDossierDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPETypeDossierDPE" (
    "idTypeDossierDPE" character varying(5) NOT NULL,
    "idClasseConsommationEnergie" integer NOT NULL,
    "idClasseEmissionGES" integer NOT NULL,
    "libelleTypeDossierDPE" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPETypeDossierDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPETypeEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPETypeEnergie" (
    "idTypeEnergie" integer NOT NULL,
    "KEYenergie" character varying(10),
    "libelleEnergie" character varying(30) NOT NULL,
    "alphaPCSI" real NOT NULL,
    "coeffEP" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPETypeEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPETypeNiveau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPETypeNiveau" (
    "idTypeNiveau" integer NOT NULL,
    "libelleNiveau" character varying(30) NOT NULL,
    "NIV" double precision NOT NULL,
    "comblesHabite" boolean NOT NULL,
    "Cniv" smallint NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPETypeNiveau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPETypeVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPETypeVentilation" (
    "idTypeVentilation" integer NOT NULL,
    "typeVentilation" character varying(4) NOT NULL,
    "IauxVentIC" real NOT NULL,
    "IauxVentMIcentral" real NOT NULL,
    "IauxVentMIdivise" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPETypeVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEZoneEte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEZoneEte" (
    "idZoneEte" character varying(2) NOT NULL,
    "RclimMI1" real NOT NULL,
    "RclimMI2" real NOT NULL,
    "RclimIC1" real NOT NULL,
    "RclimIC2" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEZoneEte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DPEZoneHiver; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DPEZoneHiver" (
    "idZoneHiver" character varying(2) NOT NULL,
    "Tef" real NOT NULL,
    "CoeffCOMPL" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DPEZoneHiver" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTG; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTG" (
    "idMission" integer NOT NULL,
    affectation character varying(255),
    usage character varying(255),
    "nbrNiveau" integer,
    "ChangeTime" timestamp without time zone,
    "genererTravaux" boolean,
    "genererAssurance" boolean,
    "genererCertificat" boolean,
    "genererObligation" boolean,
    "genererAmelioration" boolean,
    "genererDocument" boolean,
    "nomCopro" character varying(100),
    "nbLot" integer,
    "nbAscenseur" integer,
    "typeParking" integer,
    "isPorteAuto" boolean,
    "descSite" text,
    latitude numeric(18,15),
    longitude numeric(18,15),
    "isChauffageCollectif" boolean NOT NULL,
    "isEcsCollectif" boolean NOT NULL,
    "familleImmeuble" character varying(5),
    "typeSyndic" character varying(100),
    "echelleTravaux" character varying(100),
    "idMissionDPE" uuid,
    "genererTravPPPTParPoste" boolean,
    "genererTavPPPTParEch" boolean,
    "isDTG" boolean NOT NULL,
    "moduleRevision" integer,
    "genererEtatInitial" boolean,
    "genererOuvrageENR" boolean,
    "genererTravPPPTParCategorie" boolean,
    "genererSyntheseTravaux" boolean,
    "genererComparatif" boolean,
    "genererFicheRecap" boolean,
    "refAdemePPPT" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DTG" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGAmeliorations; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGAmeliorations" (
    "idDtgAmeliorations" integer NOT NULL,
    "idMission" integer NOT NULL,
    categorie character varying(255),
    intitule character varying(255),
    amelioration text
);


ALTER TABLE public."(ADN_DIAG) DTGAmeliorations" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGDiagnostic; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGDiagnostic" (
    "idDtgDiagnostic" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idParent" integer,
    intitule character varying(255),
    description text,
    nature character varying(255),
    "isOuvrage" boolean,
    "etatRisque" integer,
    "etatVisibilite" integer,
    commentaires text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    ordre integer,
    "palierTravaux" integer,
    "keyDPE" character varying(10),
    "idItemDPEAdeme" character varying(255),
    "qualArch" integer,
    "qualEnr" integer,
    "confortEte" integer,
    "typePropriete" character varying(5),
    "gesteEntretien" text,
    logo bytea
);


ALTER TABLE public."(ADN_DIAG) DTGDiagnostic" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGDiagnosticPhoto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGDiagnosticPhoto" (
    "idPhoto" integer NOT NULL,
    "idDtgDiagnostic" integer NOT NULL,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "isGenerer" boolean NOT NULL,
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) DTGDiagnosticPhoto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGDocuments; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGDocuments" (
    "idDtgDocuments" integer NOT NULL,
    "idMission" integer NOT NULL,
    categorie character varying(255),
    intitule character varying(500),
    observations text,
    etat integer
);


ALTER TABLE public."(ADN_DIAG) DTGDocuments" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGEnumDetailModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGEnumDetailModele" (
    "idDtgDetailEnumModele" integer NOT NULL,
    "idDtgEnumModele" integer NOT NULL,
    "idParent" integer,
    intitule character varying(255),
    "isOuvrage" boolean,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "toAdd" boolean,
    "keyDPE" character varying(10),
    "typePropriete" character varying(5),
    "gesteEntretien" text,
    logo bytea,
    "customField1" character varying(255),
    "customField2" character varying(255),
    "customField3" character varying(255),
    "customField4" character varying(255),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) DTGEnumDetailModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGEnumModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGEnumModele" (
    "idDtgEnumModele" integer NOT NULL,
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) DTGEnumModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGEnumTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGEnumTravaux" (
    "idDtgEnumTravaux" integer NOT NULL,
    intitule character varying(255),
    categorie character varying(255),
    description text,
    "coutMin" real,
    "coutMax" real,
    "isInf10" boolean,
    "isUnitaire" boolean,
    quantite real,
    "coutUnitMin" real,
    "coutUnitMax" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "codeCategorie" character varying(255),
    "codePoste" character varying(255),
    "typePropriete" character varying(5),
    "codeType" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) DTGEnumTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGEnumTxtStandard; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGEnumTxtStandard" (
    "idDtgEnumTxt" integer NOT NULL,
    categorie character varying(255),
    designation character varying(255),
    valeur text,
    "idType" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    ordre integer,
    "isDefault" boolean NOT NULL,
    logo bytea,
    "dateFin" timestamp without time zone,
    "customField1" character varying(255),
    "customField2" character varying(255),
    "customField3" character varying(255),
    "customField4" character varying(255),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) DTGEnumTxtStandard" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGObligations; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGObligations" (
    "idDtgObligations" integer NOT NULL,
    "idMission" integer NOT NULL,
    designation character varying(255),
    obligation text,
    etat integer,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) DTGObligations" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGPlanTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGPlanTravaux" (
    "idPlanTravaux" integer NOT NULL,
    "idMission" integer,
    intitule character varying(255),
    commentaire text,
    "isGenerer" boolean,
    "numPlan" integer,
    "isSynthese" boolean,
    "numPlanLibre" integer,
    "numPlanParent" integer
);


ALTER TABLE public."(ADN_DIAG) DTGPlanTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DTGTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DTGTravaux" (
    "idDtgTravaux" integer NOT NULL,
    "idDtgDiagnostic" integer,
    intitule text,
    categorie character varying(255),
    description text,
    "coutMin" real,
    "coutMax" real,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "isInf10" boolean,
    "isUnitaire" boolean,
    quantite real,
    "coutUnitMin" real,
    "coutUnitMax" real,
    palier integer,
    ordre integer,
    "codeCategorie" character varying(255),
    "codePoste" character varying(255),
    "idSimulationDPE" character varying(255),
    "idItemDPEAdeme" character varying(255),
    "idPrecoDPEAdeme" character varying(255),
    "typePropriete" character varying(5),
    "numPlanTrav" integer,
    "idMission" integer,
    "codeType" character varying(255),
    "idUnique" uuid
);


ALTER TABLE public."(ADN_DIAG) DTGTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DbParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DbParam" (
    "idBase" integer NOT NULL,
    "compteurDossier" integer NOT NULL,
    "DBStructureVersion" integer,
    "DBDataVersion" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DbParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Dossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Dossier" (
    "idDossier" integer NOT NULL,
    numero integer NOT NULL,
    "idRefDossier" integer,
    "idSiteGestion" character varying(50),
    "idBien" integer,
    "idEmployeIntervention" integer,
    "idEmployeCommande" integer,
    "idEmployeRedaction" integer,
    "idEmployerPublication" integer,
    reference character varying(255),
    "referenceExterne" character varying(255),
    "dateCommande" timestamp without time zone,
    "dateRapport" timestamp without time zone,
    "datePublication" timestamp without time zone,
    "dateSignatureNotaire" timestamp without time zone,
    "idCadreMission" character varying(50),
    "contactPlace" character varying(100),
    accompagnateur character varying(100),
    verrouille boolean,
    "idStatut" integer,
    "dateDebutMission" timestamp without time zone,
    "dateFinMission" timestamp without time zone,
    "heureRDV" timestamp without time zone,
    "heureFin" timestamp without time zone,
    "idRdv" integer,
    commentaire text,
    "codeBien" character varying(100),
    "discBien" character varying(1),
    "typeProprieteBatiment" character varying(10),
    "typeProprieteLot" character varying(10),
    "usageBien" character varying(10),
    "isBati" boolean NOT NULL,
    "articleNature" character varying(50),
    nature character varying(50),
    "nomBatiment" character varying(100),
    adresse character varying(100),
    "cptAdresse" character varying(100),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "numeroLot" character varying(50),
    niveau real,
    etage character varying(100),
    "sectionCadastrale" character varying(50),
    parcelle character varying(50),
    "anneeConstruction" character varying(100),
    "anneePermisConstruire" character varying(100),
    entree character varying(100),
    escalier character varying(100),
    porte character varying(100),
    "nbLocaux" integer,
    "nbNiveaux" integer,
    "quotePart" integer,
    "quotePartTotale" integer,
    digicode character varying(50),
    "categorieRAAA" integer,
    "isMitoyen" boolean NOT NULL,
    "isIOP" boolean NOT NULL,
    "isERP" boolean NOT NULL,
    "typeERP" character varying(5),
    "catERP" integer,
    "isIGH" integer NOT NULL,
    "isAlimGazVille" boolean NOT NULL,
    "isChauffageCollectif" boolean NOT NULL,
    "isEcsCollectif" boolean NOT NULL,
    occupant integer NOT NULL,
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "IdUserCre" integer,
    "idUserMaj" integer,
    "idUserSup" integer,
    "dateArchive" timestamp without time zone,
    "idResCroquisBuilder" uuid,
    "idResMemoVocal" uuid,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "RefSync" integer,
    "guidSdl" uuid,
    "ChangeTime" timestamp without time zone,
    "LastSyncTime" timestamp without time zone,
    "idPub" integer,
    "datePub" timestamp without time zone,
    "statusPub" integer NOT NULL,
    "migratedData" boolean,
    "DateLastRN" timestamp without time zone,
    "DateLastES" timestamp without time zone,
    "idUserLastRN" integer,
    "idUserLastES" integer,
    "tarifOM" numeric(18,2),
    "isExpirationNomade" boolean,
    "DateLastRNdata" timestamp without time zone,
    "DateLastESdata" timestamp without time zone,
    "tempsIntervention" numeric(18,1),
    "isReglementSurSite" boolean NOT NULL,
    "moyenPaiement" character varying(100),
    "numeroCheque" character varying(50),
    "banqueCheque" character varying(255),
    "typeCB" character varying(100),
    "numeroCB" character varying(20),
    "dateExpCB" timestamp without time zone,
    "cryptoCB" character varying(10),
    "numPermisConstruire" character varying(50),
    "isPermisGroupe" boolean NOT NULL,
    "dateArchiveData" timestamp without time zone,
    "isArchivable" boolean,
    "numVoie" character varying(50),
    "cptNumVoie" character varying(10),
    "typeVoie" character varying(10),
    "codeInsee" integer,
    "anneeRehabilitation" character varying(255),
    latitude numeric(18,15),
    longitude numeric(18,15),
    "jeuMatrice" character varying(255),
    "nbCles" integer,
    "infoCles" text,
    priorite integer NOT NULL,
    "isAPO" boolean NOT NULL,
    "etapeAPO" character varying(5),
    "statutAPO" integer,
    "dateStartAPO" timestamp without time zone,
    "dateFinAPO" timestamp without time zone,
    "idContrat" integer,
    "justifOccupant" text,
    "natureTravaux" text,
    "idSociete" character varying(50) NOT NULL,
    "idSocieteIntervention" character varying(50) NOT NULL,
    "idSiteGestionIntervention" character varying(50) NOT NULL,
    "numeroSociete" integer,
    "nbAnxCroquisDynamique" text,
    "idFiscal" character varying(100),
    "categorieBien" character varying(5),
    poids double precision,
    largeur double precision,
    longueur double precision,
    hauteur double precision,
    constructeur character varying(255),
    surface real,
    volume double precision,
    "uniteVolume" character varying(10),
    "commentaireIntervention" text,
    "idMPOM" uuid,
    "idMPPG" uuid,
    "idMPNS" uuid,
    "SiaResultMLAD" text,
    "SiaResultRAA" text,
    "numCopro" character varying(100),
    "infoBAN" text,
    "usageAnterieur" character varying(10),
    "idExterne" character varying(50),
    atlitude integer,
    historique text,
    "idResPhotoPlanAcces" uuid,
    "previewPhotoPlanAcces" bytea,
    "idResPhotoPlanAerien" uuid,
    "previewPhotoPlanAerien" bytea,
    "hspMoy" real,
    "surfacePC" real,
    "idBatimentRnb" character varying(255),
    "RPLSbien" character varying(50),
    "trajetKm" real
);


ALTER TABLE public."(ADN_DIAG) Dossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierAction; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierAction" (
    "idAction" integer NOT NULL,
    "idDossier" integer NOT NULL,
    type character varying(1),
    categorie character varying(100),
    description character varying(255),
    resultat integer,
    date timestamp without time zone,
    "errorLog" text,
    "isUser" integer,
    "idProcessLog" integer,
    "configData" text,
    "configVersion" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) DossierAction" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierBien" (
    "idDossierBien" uuid NOT NULL,
    "idDossier" integer NOT NULL,
    "idBien" integer NOT NULL,
    "idDossierBatimentParent" uuid,
    intitule character varying(100),
    numero character varying(10),
    ordre integer,
    "discBien" character varying(1),
    "typeProprieteBatiment" character varying(10),
    usage character varying(10),
    "isBati" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) DossierBien" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierElement" (
    "idDossierElement" integer NOT NULL,
    "idDossierLocal" uuid NOT NULL,
    "idCategorieElement" character varying(10),
    ordre integer,
    "nomElement" character varying(100),
    "nomSousElement" character varying(100),
    substrat character varying(100),
    revetement character varying(100),
    zone character varying(50),
    "categorieAmiante" character varying(255),
    "typeCFA" character varying(2),
    couleur character varying(50),
    "couleurHexa" character varying(6),
    "isSCAmiante" boolean NOT NULL,
    "isSCParasite" boolean NOT NULL,
    "isSCPlomb" boolean NOT NULL,
    "obsPlomb" character varying(255),
    "isPropagA" boolean,
    "isPropagT" boolean,
    "isPropagP" boolean,
    "listeAmiante" character varying(5),
    "typeGEAmiante" character varying(2),
    "customFieldAmiante1" character varying(255),
    "customFieldPlomb1" character varying(255),
    "customFieldTermite1" character varying(255),
    "customFieldMateriauAmiante" character varying(255),
    "customFieldMateriauPlomb" character varying(255),
    "customFieldMateriauTermite" character varying(255),
    latitude numeric(18,15),
    longitude numeric(18,15),
    "numMPCA" integer,
    "reperePlan" character varying(255),
    "etatDegradationAmiante" character varying(50),
    "idExterne" character varying(50),
    "codePCA360" character varying(500)
);


ALTER TABLE public."(ADN_DIAG) DossierElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierInterlocuteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierInterlocuteur" (
    "idInterlocuteur" integer NOT NULL,
    "idRole" integer NOT NULL,
    "idDossier" integer NOT NULL,
    ordre integer,
    "typePersonne" character varying(1),
    qualite character varying(50),
    titre character varying(50),
    nom character varying(100),
    prenom character varying(50),
    adresse1 character varying(255),
    adresse2 character varying(255),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "idContact" integer,
    "referenceDossier" character varying(255),
    "isCourrierRapport" boolean NOT NULL,
    "isFaxRapport" boolean NOT NULL,
    "isMailRapport" boolean NOT NULL,
    "txCom" double precision,
    "ChangeTime" timestamp without time zone,
    "useDataCopy" boolean NOT NULL,
    "detailRole" character varying(255),
    "infoBAN" text,
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) DossierInterlocuteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierLocal" (
    "idDossierLocal" uuid NOT NULL,
    "idOriginal" integer,
    "idDossier" integer NOT NULL,
    "categorieLocal" character varying(2) NOT NULL,
    "idTypeLocalNSH" character varying(50),
    ordre integer,
    numero character varying(50),
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisitable" boolean NOT NULL,
    justification text,
    "surfaceHorsCarrez" real,
    "surfaceCarrez" real,
    "surfaceNPC" real,
    hsp real,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "isPieceHumide" boolean,
    "isSDB" boolean,
    "isWC" boolean,
    "isCuisine" boolean,
    "isSomeil" boolean,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50),
    zone character varying(255),
    "moyenAccesNV" text,
    commentaire text,
    "idExterne" character varying(50),
    "idA360" integer
);


ALTER TABLE public."(ADN_DIAG) DossierLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierLocalMission; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierLocalMission" (
    "idDossierLocal" uuid NOT NULL,
    "idMission" integer NOT NULL,
    statut integer NOT NULL,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DossierLocalMission" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DossierLotDependance; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DossierLotDependance" (
    "idDossierLotDependance" integer NOT NULL,
    "idDossier" integer NOT NULL,
    ordre integer,
    numero character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isAuto" boolean NOT NULL,
    "ChangeTime" timestamp without time zone,
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) DossierLotDependance" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Dti; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Dti" (
    "idMission" integer NOT NULL,
    "ageImmeuble" character varying(50),
    "commentaireImmeuble" text,
    classement text,
    "titreParagrapheDivers" character varying(50),
    "isGenererProprietaire" boolean,
    "isGenererNotaire" boolean,
    "isGenererDonneurOrdre" boolean,
    "isGenererAnnexe" boolean,
    "isGenererEtage" boolean,
    "isClasserParEtage" boolean,
    "isModeCaseACocher" boolean,
    "isGenererAccesClosCouvert" boolean,
    "isGenererAccesConduiteCanalisation" boolean,
    "isGenererAccesEqipement" boolean,
    "commentaireLots" text,
    "commentaireServitudes" text,
    "nbLots" integer,
    tantiemes character varying(50),
    "risqueAmiante" text,
    "risquePlomb" text,
    "risqueTermite" text,
    "risqueSismique" text,
    "idResPhotoRiskS" uuid,
    "previewDataPhotoRiskS" bytea,
    "idResPhotoPG" uuid,
    "previewDataPhotoPG" bytea,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) Dti" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiCompositionImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiCompositionImmeuble" (
    "idComposition" integer NOT NULL,
    "idMission" integer,
    etage character varying(50),
    niveau real,
    intitule text
);


ALTER TABLE public."(ADN_DIAG) DtiCompositionImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiElement" (
    "idElement" integer NOT NULL,
    "idOuvrage" integer,
    "nomElement" character varying(100),
    "nomSousElement" character varying(100),
    nature character varying(100),
    etage character varying(100),
    niveau real,
    ordre integer,
    commentaire text,
    etat character varying(100),
    danger character varying(100),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "commentairePhoto" text,
    "isAcces" boolean,
    "isPresent" boolean,
    "isInaccessible" boolean,
    "etatCaseACocher" integer
);


ALTER TABLE public."(ADN_DIAG) DtiElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiLot" (
    "idLot" integer NOT NULL,
    "idMission" integer,
    numero integer,
    intitule character varying(100),
    etage character varying(50),
    niveau real,
    composition text,
    surface real,
    repartition real,
    tantieme character varying(50),
    carence text
);


ALTER TABLE public."(ADN_DIAG) DtiLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiOuvrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiOuvrage" (
    "idOuvrage" integer NOT NULL,
    "idMission" integer,
    intitule character varying(100),
    "discSectionDiag" character varying(50),
    "categorieOuvrage" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) DtiOuvrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiParam" (
    "idDtiParam" integer NOT NULL,
    "isLoiTexte" boolean,
    "isGenererProprietaire" boolean,
    "isGenererNotaire" boolean,
    "isGenererDonneurOrdre" boolean,
    "isGenererAnnexe" boolean,
    "isGenererEtage" boolean,
    "isClasserParEtage" boolean,
    "isModeCaseACocher" boolean,
    "isGenererAccesClosCouvert" boolean,
    "isGenererAccesConduiteCanalisation" boolean,
    "isGenererAccesEqipement" boolean,
    "titreParagrapheDivers" character varying(50),
    "idResPhotoPG" uuid,
    "previewDataPhotoPG" bytea,
    "idResPhotoRiskS" uuid,
    "previewDataPhotoRiskS" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DtiParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiRelElementSousElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiRelElementSousElement" (
    "idRelation" integer NOT NULL,
    "idElement" integer,
    "idSousElement" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DtiRelElementSousElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiRelOuvrageElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiRelOuvrageElement" (
    "idRelation" integer NOT NULL,
    "idOuvrage" integer,
    "idElement" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) DtiRelOuvrageElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) DtiResultat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) DtiResultat" (
    "idResultat" integer NOT NULL,
    "idMission" integer,
    "discType" character varying(10),
    categorie character varying(100),
    intitule text
);


ALTER TABLE public."(ADN_DIAG) DtiResultat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDL; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDL" (
    "idMission" integer NOT NULL,
    "modeChauffage" character varying(255),
    "propreteDesLieux" character varying(255),
    "observationsParticulieres" text,
    "compteurEDFJour" double precision,
    "compteurEDFNuit" double precision,
    "electriciteEDFJourOui" boolean NOT NULL,
    "electriciteEDFJourCoupe" boolean NOT NULL,
    "electriciteEDFNuitOui" boolean NOT NULL,
    "electriciteEDFNuitCoupe" boolean NOT NULL,
    "compteurGDF" double precision,
    "gazOui" boolean NOT NULL,
    "gazCoupe" boolean NOT NULL,
    "nombreTotalCle" integer,
    "totalCleGardien" integer,
    "totalCleExpert" integer,
    "raisonDepart" character varying(255),
    "dateEntreeLocSortant" timestamp without time zone,
    "isGenererInventaireCle" boolean NOT NULL,
    "isGenererMultimedia" boolean NOT NULL,
    "isEntrant" boolean NOT NULL,
    "isSortant" boolean NOT NULL,
    "isGenererElectricite" boolean NOT NULL,
    "isGenererGaz" boolean NOT NULL,
    "isGenererEDL" boolean NOT NULL,
    "referenceEP" character varying(255),
    "idEDLAccess" integer,
    "isGenererAB" boolean NOT NULL,
    "isGenererLigneVide" boolean NOT NULL,
    "isGenererAnnexeCB" boolean NOT NULL,
    "isSeparationElemHumide" boolean NOT NULL,
    "isGenererComparatif" boolean NOT NULL,
    "isGenererLigneRouge" boolean NOT NULL,
    "EDFLocalisation" character varying(255),
    "GazLocalisation" character varying(255),
    "EDFObservation" text,
    "GazObservation" text,
    "isMutualisationPhoto" boolean NOT NULL,
    "modeDescEtat" integer NOT NULL,
    "numeroCompteurEDF" character varying(100),
    "numeroCompteurGDF" character varying(100)
);


ALTER TABLE public."(ADN_DIAG) EDL" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLCle; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLCle" (
    "idCleBien" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idTypeCle" character varying(50),
    "nbTotal" integer NOT NULL,
    "nbExpert" integer NOT NULL,
    "nbGardien" integer NOT NULL,
    "infosExpert" character varying(255),
    "infosGardien" character varying(255),
    ordre integer,
    etat character varying(50),
    observation text,
    "isEP" boolean,
    "idCleParent" integer,
    "idTravaux" integer,
    "isTN" boolean,
    "isExcluComparatif" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) EDLCle" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLCompteurEau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLCompteurEau" (
    "idCompteur" integer NOT NULL,
    "idMission" integer NOT NULL,
    localisation character varying(250),
    "releveEauChaude" character varying(20),
    "releveEauFroide" character varying(20),
    "isEau" boolean NOT NULL,
    "isCoupe" boolean NOT NULL,
    observation text,
    "typeCompteur" integer NOT NULL,
    "numeroCompteur" character varying(100)
);


ALTER TABLE public."(ADN_DIAG) EDLCompteurEau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLDependance; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLDependance" (
    "idDependance" integer NOT NULL,
    "idMission" integer NOT NULL,
    ordre integer,
    "aVider" boolean NOT NULL,
    "qteAVider" character varying(50),
    numero character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "numeroPorte" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) EDLDependance" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLElement" (
    "idElement" integer NOT NULL,
    "idElementParent" integer,
    "idLocal" integer NOT NULL,
    intitule character varying(255),
    "sousElement" character varying(255),
    etat character varying(50),
    nature character varying(100),
    caracteristique character varying(100),
    observation text,
    zone character varying(50),
    "reparationA" boolean NOT NULL,
    "reparationB" boolean NOT NULL,
    ordre integer,
    tc integer NOT NULL,
    bloque boolean NOT NULL,
    "ligneVide" boolean NOT NULL,
    "nonPresent" boolean NOT NULL,
    couleur character varying(50),
    "couleurHexa" character varying(6),
    "etatMarche" character varying(50),
    nb integer NOT NULL,
    "isEquipement" boolean NOT NULL,
    "isAppareil" boolean NOT NULL,
    "idCategorieElement" character varying(50),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "justificatifTravaux" text,
    "chiffrageTravaux" double precision,
    "isEP" boolean NOT NULL,
    "isTN" boolean,
    "qteTravaux" double precision,
    "typeQte" character varying(100),
    "coefVetuste" double precision,
    "dateInstallation" timestamp without time zone,
    "isExcluComparatif" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) EDLElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLEquipementDivers" (
    "idEquipementDivers" integer NOT NULL,
    "idMission" integer NOT NULL,
    intitule character varying(255),
    localisation character varying(255)
);


ALTER TABLE public."(ADN_DIAG) EDLEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLLienTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLLienTravaux" (
    "idLienTravaux" integer NOT NULL,
    "idTravaux" integer NOT NULL,
    "idLocal" integer NOT NULL,
    "idElement" integer
);


ALTER TABLE public."(ADN_DIAG) EDLLienTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLLocal" (
    "idLocal" integer NOT NULL,
    "idMission" integer NOT NULL,
    nom character varying(100),
    "isFiniVisite" boolean NOT NULL,
    "situationPiece" character varying(255),
    niveau real,
    etage character varying(50),
    "idDossierLocal" uuid,
    ordre integer,
    commentaire text,
    "isPieceHumide" boolean NOT NULL,
    "isSDB" boolean NOT NULL,
    "isWC" boolean NOT NULL,
    "isCuisine" boolean NOT NULL,
    "isSomeil" boolean NOT NULL,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "dateRenovation" timestamp without time zone,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) EDLLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLParam" (
    "idEdlParam" integer NOT NULL,
    "isGenererAB" boolean NOT NULL,
    "isGenererLigneVide" boolean NOT NULL,
    "isSeparationElemHumide" boolean NOT NULL,
    "isGenererInventaireCle" boolean NOT NULL,
    "isGenererElectricite" boolean NOT NULL,
    "isGenererGaz" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isGenererLigneRouge" boolean NOT NULL,
    "isMutualisationPhoto" boolean NOT NULL,
    "modeDescEtatDefaut" integer NOT NULL,
    "etat1Intitule" character varying(50),
    "etat1Valeur" text,
    "etat1Image" bytea,
    "etat2Intitule" character varying(50),
    "etat2Valeur" text,
    "etat2Image" bytea,
    "etat3Intitule" character varying(50),
    "etat3Valeur" text,
    "etat3Image" bytea,
    "etat4Intitule" character varying(50),
    "etat4Valeur" text,
    "etat4Image" bytea,
    "idContrat" integer
);


ALTER TABLE public."(ADN_DIAG) EDLParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLProductionECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLProductionECS" (
    "idBienProductionECS" integer NOT NULL,
    "idMission" integer NOT NULL,
    "systemeProdECS" character varying(255),
    marque character varying(50),
    nombre character varying(20)
);


ALTER TABLE public."(ADN_DIAG) EDLProductionECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLQuestion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLQuestion" (
    "idQuestion" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idFamille" integer NOT NULL,
    "idCategorie" integer,
    "position" integer,
    question character varying(255),
    reponse boolean,
    observation text
);


ALTER TABLE public."(ADN_DIAG) EDLQuestion" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EDLTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EDLTravaux" (
    "idTravaux" integer NOT NULL,
    "idMission" integer NOT NULL,
    intitule text,
    "prixUHT" double precision,
    "coefVetuste" double precision,
    qte double precision,
    "typePrix" character varying(100),
    tva double precision,
    "prixHT" double precision,
    "prixTTC" double precision,
    commentaire text,
    "idRoleInterlocuteur" integer
);


ALTER TABLE public."(ADN_DIAG) EDLTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNT" (
    "idMission" integer NOT NULL,
    "idExpert" integer,
    "dateERNT" timestamp without time zone,
    "heureERNT" timestamp without time zone,
    "refERNT" character varying(100),
    "dateRapportERNT" timestamp without time zone,
    "dateCommandeERNT" timestamp without time zone,
    "heureFinERNT" timestamp without time zone,
    "PPRnPrescrit" boolean,
    "PPRnAnticipation" boolean,
    "PPRnApprouve" boolean,
    "Innondation" boolean,
    "CrueTorrentielle" boolean,
    "RemonteeNappe" boolean,
    "Avalanche" boolean,
    "MouvementTerrain" boolean,
    "Secheresse" boolean,
    "Seisme" boolean,
    "Cyclone" boolean,
    "Volcan" boolean,
    "FeuxForet" boolean,
    "AutreRisqueNaturel" text,
    "PPRtApprouve" boolean,
    "PPRtPrescrit" boolean,
    "EffetThermique" boolean,
    "EffetSurpression" boolean,
    "EffetToxique" boolean,
    "ZoneSismique" integer,
    "VendeurBailleur" integer,
    "NomVendeur" character varying(100),
    "PrenomVendeur" character varying(100),
    "AcquereurLocataire" integer,
    "NomAcquereur" character varying(100),
    "PrenomAcquereur" character varying(100),
    "Commentaire" text,
    "numeroArrete" character varying(50),
    "dateArrete" timestamp without time zone,
    "dateMAJArrete" timestamp without time zone,
    "isIndemnisation" boolean,
    "isGenererIndemnisation" boolean,
    "ChangeTime" timestamp without time zone,
    "isIndemnisationMentionnee" boolean,
    "isPPRnTravauxPrescrits" boolean,
    "isPPRnTravauxRealises" boolean,
    "isPPRtTravauxPrescrits" boolean,
    "isPPRtTravauxRealises" boolean,
    "isPPRmTravauxPrescrits" boolean,
    "isPPRmTravauxRealises" boolean,
    "PPRmPrescrit" boolean,
    "PPRmAnticipation" boolean,
    "PPRmApprouve" boolean,
    "PPRmMouvementTerrain" boolean,
    "PPRmAutre" character varying(500),
    "refErntOrigine" character varying(100),
    "idDocErnmt" character varying(100),
    "numDocErnmt" character varying(100),
    "modeDocErnmt" character varying(100),
    "commErnmt" character varying(255),
    "refERNMTPro" character varying(100),
    "conclusionBrute" text,
    "PPRnDate" timestamp without time zone,
    "PPRmDate" timestamp without time zone,
    "isLogement" boolean,
    "isPPRtExpropriation" boolean,
    "isInfoTypeRisqueJointe" boolean,
    "isSIS" integer,
    "isRadon" integer,
    "Argile" boolean,
    "nivArgile" integer,
    "BruitAero" boolean,
    "nivBruitAero" integer,
    "libAero" character varying(1000),
    "zoneAero" character varying(50),
    "numArretePeb" character varying(50),
    "dateArretePeb" timestamp without time zone,
    "dateMAJArretePeb" timestamp without time zone,
    "arretePebRev" boolean,
    "arretePEbApp" boolean,
    "hasTravauxPeb" boolean,
    "travauxRealisePeb" boolean,
    "datePeb" timestamp without time zone,
    "BruitAero2" boolean,
    "arretePebRev2" boolean,
    "arretePEbApp2" boolean,
    "datePeb2" timestamp without time zone,
    "libAero2" character varying(1000),
    "isGenererPeb" boolean,
    "PPRnRevision" boolean,
    "PPRmRevision" boolean,
    "PPRtRevision" boolean,
    "PPRtDate" timestamp without time zone,
    "isRTC" boolean,
    "isRTCPrescrit" boolean,
    "isRTCObligDemo" boolean,
    "isDebr" boolean
);


ALTER TABLE public."(ADN_DIAG) ERNT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNTGeneration; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNTGeneration" (
    "idGeneration" integer NOT NULL,
    "genererCommentaires" boolean,
    "genererAnnexe" boolean,
    "genererTitresAutomatique" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ERNTGeneration" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNTModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNTModele" (
    idmodele integer NOT NULL,
    "nomModele" character varying(100),
    "PPRnPrescrit" boolean,
    "PPRnAnticipation" boolean,
    "PPRnApprouve" boolean,
    "Innondation" boolean,
    "CrueTorrentielle" boolean,
    "RemonteeNappe" boolean,
    "Avalanche" boolean,
    "MouvementTerrain" boolean,
    "Secheresse" boolean,
    "Seisme" boolean,
    "Cyclone" boolean,
    "Volcan" boolean,
    "FeuxForet" boolean,
    "AutreRisqueNaturel" text,
    "PPRtApprouve" boolean,
    "PPRtPrescrit" boolean,
    "EffetThermique" boolean,
    "EffetSurpression" boolean,
    "EffetToxique" boolean,
    "ZoneSismique" integer,
    "Commentaire" text,
    "numeroArrete" character varying(50),
    "dateArrete" timestamp without time zone,
    "dateMAJArrete" timestamp without time zone,
    "idArrete" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "PPRmPrescrit" boolean,
    "PPRmAnticipation" boolean,
    "PPRmApprouve" boolean,
    "PPRmMouvementTerrain" boolean,
    "PPRmAutre" character varying(500),
    "PPRnDate" timestamp without time zone,
    "PPRmDate" timestamp without time zone,
    "isPPRtExpropriation" boolean,
    "isInfoTypeRisqueJointe" boolean,
    "isSIS" integer,
    "isRadon" integer,
    "Argile" boolean,
    "nivArgile" integer,
    "BruitAero" boolean,
    "nivBruitAero" integer,
    "libAero" character varying(1000),
    "zoneAero" character varying(50),
    "arretePebRev" boolean,
    "arretePEbApp" boolean,
    "hasTravauxPeb" boolean,
    "datePeb" timestamp without time zone,
    "BruitAero2" boolean,
    "arretePebRev2" boolean,
    "arretePEbApp2" boolean,
    "datePeb2" timestamp without time zone,
    "libAero2" character varying(1000),
    "zoneRTC" character varying(50),
    "PPRnRevision" boolean,
    "PPRmRevision" boolean,
    "PPRtRevision" boolean,
    "PPRtDate" timestamp without time zone,
    "isRTC" boolean,
    "isRTCPrescrit" boolean,
    "isRTCObligDemo" boolean,
    "isDebr" boolean,
    "isIndemnisationMentionnee" boolean
);


ALTER TABLE public."(ADN_DIAG) ERNTModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNTPieceJointe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNTPieceJointe" (
    "idPJ" integer NOT NULL,
    "idERNT" integer,
    intitule character varying(255),
    localisation character varying(255),
    "isLocalisationPointe" boolean,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    ordre integer,
    "DiscRisque" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) ERNTPieceJointe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNTPieceJointeCommune; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNTPieceJointeCommune" (
    "idPJCommune" integer NOT NULL,
    intitule character varying(255),
    localisation character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "DiscRisque" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) ERNTPieceJointeCommune" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ERNTPieceJointeModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ERNTPieceJointeModele" (
    "idPJModele" integer NOT NULL,
    "idModele" integer,
    "nomModele" character varying(255),
    intitule character varying(255),
    localisation character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "DiscRisque" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) ERNTPieceJointeModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Elec; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Elec" (
    "idMission" integer NOT NULL,
    "idInterlocuteur" integer,
    "normeUtilise" text,
    "versionNorme" character varying(50),
    "dateInstallation" timestamp without time zone,
    distributeur character varying(255),
    "isInstalProtege" boolean,
    "isCapotNonDemontable" boolean,
    "isSansDouche" boolean,
    "isProtectionFixeNonDemontable" boolean,
    "isVerifCalibreImpossible" boolean,
    "dateFinValidite" timestamp without time zone,
    "isAlimente" boolean,
    "isShowVerifCol" boolean,
    "isGenererGrille" boolean,
    "isGenererAPhotoAno" boolean,
    "isGenererAPhotoLoc" boolean,
    "isGenererAObs" boolean,
    "isSDBDuplique" boolean,
    "ChangeTime" timestamp without time zone,
    amperage character varying(100),
    "isProdElec" boolean,
    "isAlimHT" boolean,
    "isAutreRegle" boolean,
    "isComTBTS" boolean,
    "isInstallTriphase" boolean,
    "isAGCP" boolean,
    "isAGCPDifferentiel" boolean,
    "AGCPSensibilite" integer,
    "AGCPSection" double precision,
    "AGCPSectionType" character varying(50),
    "isICTerre" boolean,
    "isICDiff" boolean,
    "isICPartieCom" boolean,
    "isE3a" boolean,
    "isE3b" boolean,
    "isE3c" boolean,
    "isE3d" boolean,
    "isE3e1" boolean,
    "isE3e2" boolean,
    "isE3e3" boolean,
    "isE3e4" boolean,
    "isE3f" boolean,
    "dateInstallationTxt" character varying(50),
    "isConformeArrete2017" boolean,
    "conclusionConseil" text,
    "isGenererGrilleConseil" boolean,
    "isGenererGrilleAno" boolean,
    "isAbsBassin" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) Elec" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecConstatation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecConstatation" (
    "idElecConstatation" integer NOT NULL,
    "idElecPointControl" integer,
    constatation text,
    local text,
    "isAuto" boolean,
    "isAnomalieConstate" boolean,
    "isNorme" boolean
);


ALTER TABLE public."(ADN_DIAG) ElecConstatation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecConstatationDiv; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecConstatationDiv" (
    "idConstatationDiv" integer NOT NULL,
    "idMission" integer,
    nom character varying(255),
    description text,
    "isAuto" boolean,
    "isNorme" boolean,
    "idEnumElecPointControl" integer,
    categorie integer
);


ALTER TABLE public."(ADN_DIAG) ElecConstatationDiv" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecControl" (
    "idControl" integer NOT NULL,
    "idElecLocal" integer,
    type character varying(50),
    nom character varying(255)
);


ALTER TABLE public."(ADN_DIAG) ElecControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecLocal" (
    "IdElecLocal" integer NOT NULL,
    "idDossierLocal" uuid,
    "idMission" integer,
    ordre integer,
    numero character varying(50),
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    "isDouche" boolean,
    "isVerif" boolean,
    justification text,
    "contientVetuste" boolean,
    "contientInadapte" boolean,
    "contientVertJaune" boolean,
    "contient336EAnomalie" boolean,
    "contient337AAnomalie" boolean,
    "contient337CAnomalie" boolean,
    "contient338AAnomalie" boolean,
    "contient339BAnomalie" boolean,
    "contient3310BAnomalie" boolean,
    "contient73AAnomalie" boolean,
    "contient73BAnomalie" boolean,
    "contient73CAnomalie" boolean,
    "contient73DAnomalie" boolean,
    "contient73EAnomalie" boolean,
    "contient11BAnomalie" boolean,
    "have336FAno_NF" boolean,
    "have337AAno_NF" boolean,
    "have338AAno_NF" boolean,
    "have339BAno_NF" boolean,
    "have73AAno_NF" boolean,
    "have73BAno_NF" boolean,
    "have73C1Ano_NF" boolean,
    "have73C2Ano_NF" boolean,
    "have73DAno_NF" boolean,
    "have73EAno_NF" boolean,
    "have83AAno_NF" boolean,
    "have83BAno_NF" boolean,
    "have83CAno_NF" boolean,
    "have83DAno_NF" boolean,
    "have11BAno_NF" boolean,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) ElecLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecMesure; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecMesure" (
    "idMesure" integer NOT NULL,
    "idElecPointControl" integer,
    nom character varying(50),
    mesure real,
    local text
);


ALTER TABLE public."(ADN_DIAG) ElecMesure" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecParamDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecParamDossier" (
    "idElecParamDossier" integer NOT NULL,
    norme text,
    "versionNorme" character varying(50),
    "isActiverAuto" boolean,
    "isActiverFiltrage" boolean,
    "isActiverConst" boolean,
    "isActiverAutoB4" boolean,
    "isActiverReco" boolean,
    "isLocalAvecDouche" boolean,
    "CheminImageNorme" character varying(255),
    "isOngletVisible" boolean,
    "isSeparateSdb" boolean,
    "askForResultChange" boolean,
    "isAtliDefaut" boolean,
    "isShowSdbWarning" boolean,
    "isShowAllAuto" boolean,
    "isShowVerifCol" boolean,
    "isShowPdcWarning" boolean,
    "imagePath" character varying(255),
    "isGenererGrille" boolean,
    "isGenererAPhotoAno" boolean,
    "isGenererAPhotoLoc" boolean,
    "isGenererAObs" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer,
    "isFiltre3361SO" boolean NOT NULL,
    "isFiltre3371SO" boolean NOT NULL,
    "isFiltre3381SO" boolean NOT NULL,
    "isFiltre3391SO" boolean NOT NULL,
    "isFiltre531SO" boolean NOT NULL,
    "isFiltre331dNV" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) ElecParamDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecPhoto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecPhoto" (
    "idElecPhoto" integer NOT NULL,
    "idMission" integer,
    "idElecPointControl" integer,
    "idRecommandation" integer,
    "idElecConstatation" integer,
    "idElecLocal" integer,
    "commentairePhoto" text,
    "cheminPhoto" character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    ordre integer,
    "titrePhoto" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) ElecPhoto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecPointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecPointControl" (
    "idElecPointControl" integer NOT NULL,
    "idMission" integer,
    "idEnumElecPointControl" integer,
    "idEnumElecFicheControl" integer,
    "isActif" boolean,
    "isGenererAuto" boolean,
    "isUserModif" boolean,
    "isMakeByDefaut" boolean,
    "isCompense" boolean,
    mesure character varying(50),
    local text,
    resultat character varying(16),
    "idLocal" integer
);


ALTER TABLE public."(ADN_DIAG) ElecPointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecRecommandation" (
    "idRecommandation" integer NOT NULL,
    "idElecPointControl" integer,
    recommandation text,
    local text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "commentairePhoto" text
);


ALTER TABLE public."(ADN_DIAG) ElecRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ElecRefLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ElecRefLocal" (
    "idRefLocal" integer NOT NULL,
    "idElecConstatation" integer,
    "idRecommandation" integer,
    "idElecPointControl" integer,
    "idMesure" integer,
    "idElecLocal" integer
);


ALTER TABLE public."(ADN_DIAG) ElecRefLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmianteAPSO; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmianteAPSO" (
    "idAPSO" integer NOT NULL,
    "ValeurAPSO" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumAmianteAPSO" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmianteEtatConserv; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmianteEtatConserv" (
    "idEtatConservation" integer NOT NULL,
    "etatConservation" character varying(50),
    description character varying(255),
    "isStaticParam" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isFriable" boolean
);


ALTER TABLE public."(ADN_DIAG) EnumAmianteEtatConserv" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmianteFractionmtIV; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmianteFractionmtIV" (
    "idTypeFractnmt" integer NOT NULL,
    "keyFractionmtIV" character varying(5) NOT NULL,
    type character varying(5),
    surface character varying(50),
    fraction character varying(500),
    "Vmin" double precision,
    "Vmax" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumAmianteFractionmtIV" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmianteModeOperatoire; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmianteModeOperatoire" (
    "idModeOperatoire" integer NOT NULL,
    "codeMO" character varying(10),
    "procedeTravail" text,
    mpc text,
    epi text,
    "isCombi" boolean,
    "isBotte" boolean,
    "isGant" boolean,
    "isOreille" boolean,
    "isCasque" boolean,
    "isMasque" boolean,
    "isLunette" boolean,
    "isDefaut" boolean,
    "isDur" boolean,
    "isFibreux" boolean,
    "isListeA" boolean,
    "isListeB" boolean,
    "isListeC" boolean,
    "isListeAutres" boolean,
    "isAVTD" boolean,
    "isReperage" boolean,
    "isVerification" boolean,
    "isObsolete" boolean,
    "dateSuppr" timestamp without time zone,
    "intituleMO" character varying(255),
    "FPA" double precision,
    "Tmin" double precision,
    "Tmax" double precision,
    "isFiltrePoussiere" boolean,
    "isFiltreListe" boolean,
    "isFiltreNature" boolean,
    "isFiltreCarac" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "useControle" boolean,
    "dateControle" timestamp without time zone,
    "organismeControle" character varying(50),
    "tauxControle" double precision
);


ALTER TABLE public."(ADN_DIAG) EnumAmianteModeOperatoire" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmiantePRItem; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmiantePRItem" (
    "idEnumPRItem" integer NOT NULL,
    "codePRItem" character varying(10),
    "discClassGeneric" character varying(10),
    "codeClass" character varying(10),
    "intituleClassNiv1Perso" character varying(255),
    "intituleClassNiv2Perso" character varying(255),
    intitule character varying(255),
    "itemType" character varying(1),
    "precoSondZPSOCAmiante" text,
    "precoSondZPSODAmiante" text,
    "precoNbPrelevAmiante" integer,
    "isOuvrageBat" boolean NOT NULL,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idContrat" integer,
    "idTypeMission" character varying(10),
    "keyFractionmtIV" character varying(5),
    "isEncapsulageIV" boolean,
    "SzoneIV" double precision,
    "NbsecteurIV" integer,
    "idEnumPRItemSource" integer,
    "intituleClassNiv3Perso" character varying(255),
    "intituleClassNiv4Perso" character varying(255),
    "isPlvD" boolean NOT NULL,
    "isPlvND" boolean NOT NULL,
    "indiceLegende" integer,
    "codePCA360" character varying(500)
);


ALTER TABLE public."(ADN_DIAG) EnumAmiantePRItem" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmiantePreco; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmiantePreco" (
    "idPreco" integer NOT NULL,
    preconisation character varying(50),
    description character varying(255),
    "isStaticParam" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isFriable" boolean,
    "CodeGrilleEval" integer,
    "isBati" boolean NOT NULL,
    seuil1 double precision,
    seuil2 double precision,
    disc character varying(5)
);


ALTER TABLE public."(ADN_DIAG) EnumAmiantePreco" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumAmiantePresence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumAmiantePresence" (
    "idPresence" integer NOT NULL,
    presence character varying(2),
    description character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumAmiantePresence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCIBCatEquip; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCIBCatEquip" (
    "idEnumCIBCatEquip" integer NOT NULL,
    "libelleCategorie" character varying(255),
    "InsertTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCIBCatEquip" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCIBEquipement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCIBEquipement" (
    "idEnumCIBEquip" integer NOT NULL,
    "isResultOuiNon" boolean,
    "idEnumCIBCatEquip" integer,
    libelle character varying(255),
    "isEquipImm" boolean,
    "InsertTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCIBEquipement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCLHDiscriminantZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCLHDiscriminantZone" (
    "discriminantZone" character varying(10) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idGroupePrerequis" integer,
    "idGroupePtCtrl" integer,
    "categorieZone" character varying(50),
    intitule character varying(255),
    hierarchie integer,
    "isPropreteEtat" boolean NOT NULL,
    "isSurface" boolean NOT NULL,
    "isSize" boolean NOT NULL,
    "isCapacite" boolean NOT NULL,
    "defautCapacite" real,
    "libelleCapacite" character varying(100),
    "uniteCapacite" character varying(50),
    "isDefaut" boolean NOT NULL,
    ordre integer,
    "isHidden" boolean,
    "hasChildZones" boolean,
    logo bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCLHDiscriminantZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCLHGroupe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCLHGroupe" (
    "idGroupe" integer NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "typeGroupe" character varying(10) NOT NULL,
    numero character varying(10),
    ordre integer,
    intitule text,
    "precision" text,
    "isApplicableZone" boolean NOT NULL,
    "idParent" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCLHGroupe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCLHPointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCLHPointControl" (
    "idEnumPtCtrl" integer NOT NULL,
    categorie character varying(10) NOT NULL,
    intitule text,
    "typeOriginal" character varying(5) NOT NULL,
    "isTypeVariable" boolean NOT NULL,
    "typeModifie" character varying(5),
    "typeModifie2" character varying(5),
    "precisionCalcul" text,
    "etatMin" real,
    "propreteMin" real,
    "fichierAide" uuid,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCLHPointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCLHPointControlCommun; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCLHPointControlCommun" (
    "idEnumPtCtrl" integer NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idGroupe" integer,
    numero character varying(10),
    ordre integer,
    "intituleCommun" text,
    "precision" text,
    "nbPoints" integer,
    "isNbPointsManuel" boolean NOT NULL,
    "nbPointsManuelMax" integer,
    "discriminantZone" character varying(10),
    "capaciteZone" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCLHPointControlCommun" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCLHPrerequis; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCLHPrerequis" (
    "discriminantPrerequis" character varying(15) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idGroupePrerequis" integer,
    "idGroupePtCtrl" integer,
    "discriminantZone" character varying(10),
    "capaciteZone" real,
    "isExigeZone" boolean NOT NULL,
    intitule text,
    "typeValeur" character varying(10),
    "valeurNumDefaut" real,
    "valeurTxtDefaut" text,
    "ordreOriginal" integer,
    "isMultiple" boolean NOT NULL,
    "isExemption" boolean NOT NULL,
    "isHidden" boolean NOT NULL,
    "isEditable" boolean NOT NULL,
    "isNombreItems" boolean,
    logo bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCLHPrerequis" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCarrezJustification; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCarrezJustification" (
    "idJustification" integer NOT NULL,
    intitule character varying(100),
    memo character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCarrezJustification" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumCategorieElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumCategorieElement" (
    "idCategorieElement" character varying(10) NOT NULL,
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumCategorieElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEAnneeConstruction; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEAnneeConstruction" (
    "idEnumereAnneeConstruction" integer NOT NULL,
    "libelleAnneeConstruction" character varying(30) NOT NULL,
    "anDepart" integer NOT NULL,
    "anFin" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEAnneeConstruction" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEApplicationRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEApplicationRecommandation" (
    "idEnumereApplicationRecommandation" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    "libelleRecommandation" text,
    "tarifMin" double precision,
    "tarifMax" double precision,
    "isTarifForfaitaire" boolean,
    "pourcentageCreditImpot" double precision,
    "isApplicableMaisonAncienne" boolean,
    "libelleRecommandationCourt" character varying(255),
    "isAutoApplicable" boolean,
    "isMI" boolean,
    "isIC" boolean,
    "R" double precision,
    "U" double precision,
    "idDonneSur" integer,
    "aRA" double precision,
    "hasVolet" boolean,
    "hasArgon" boolean,
    "idMenuiserie" integer,
    "idVitrage" integer,
    "idLameAir" integer,
    "isITI" boolean,
    "isITE" boolean,
    "idMenuiserieFilter" integer,
    "idVitrageFilter" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "idSdl" integer,
    "idGroupeRecommandation" integer
);


ALTER TABLE public."(ADN_DIAG) EnumDPEApplicationRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPECORPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPECORPlafond" (
    "idEnumereCORPlafond" integer NOT NULL,
    "keyCORPlafond" character varying(5) NOT NULL,
    "typePlafond" character varying(30) NOT NULL,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPECORPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPECORmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPECORmur" (
    "idEnumereCORmur" integer NOT NULL,
    "keyCORmur" character varying(5) NOT NULL,
    "libelleCORmur" character varying(30) NOT NULL,
    "CORmur" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPECORmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPECORsol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPECORsol" (
    "idEnumereCORsol" integer NOT NULL,
    "keyCORsol" character varying(5) NOT NULL,
    "typeSol" character varying(50) NOT NULL,
    "CORsol" double precision NOT NULL,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPECORsol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEComDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEComDossier" (
    "idEnumDPECom" integer NOT NULL,
    "libelleCommentaire" character varying(100),
    commentaire text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEComDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPECombustible; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPECombustible" (
    "idEnumereCombustible" integer NOT NULL,
    "idTypeEnergie" integer NOT NULL,
    "libelleCombustible" character varying(100) NOT NULL,
    "libelleUnite" character varying(10) NOT NULL,
    "kwhParUnite" double precision NOT NULL,
    "kwhParUnite2" double precision,
    "coeffCO2ch" real NOT NULL,
    "coeffCO2ecs" real NOT NULL,
    "coeffCO2refroidissement" real,
    "coeffCO2chAutre" real NOT NULL,
    "coeffCO2ecsAutre" real NOT NULL,
    "coeffCO2refroidissementAutre" real,
    "coeffCO2ToutUsage" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPECombustible" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEConfigurationAppartement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEConfigurationAppartement" (
    "idEnumereConfigurationAppartement" integer NOT NULL,
    "descriptionCourteConfigurationAppartement" character varying(100) NOT NULL,
    "libelleConfigurationAppartement" character varying(255) NOT NULL,
    "deperditionPlancherHaut" boolean NOT NULL,
    "deperditionPlancherHautPartiel" boolean NOT NULL,
    "localNonChauffeHaut" boolean NOT NULL,
    "deperditionPlancherBas" boolean NOT NULL,
    "deperditionPlancherBasPartiel" boolean NOT NULL,
    "localNonChauffeBas" boolean NOT NULL,
    "isEtageIntermediaire" boolean NOT NULL,
    "coeffScombles" double precision NOT NULL,
    "coeffSterrasse" double precision NOT NULL,
    "coeffSsol" double precision NOT NULL,
    lpbeme double precision NOT NULL,
    lpbime double precision NOT NULL,
    ltpme double precision NOT NULL,
    lpibme double precision NOT NULL,
    lpihme double precision NOT NULL,
    ltteme double precision NOT NULL,
    lttime double precision NOT NULL,
    ltcme double precision NOT NULL,
    lrfme double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEConfigurationAppartement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEConfigurationMI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEConfigurationMI" (
    "idEnumereConfiguration" integer NOT NULL,
    "typeConfiguration" character varying(1) NOT NULL,
    "descriptionConfiguration" character varying(50) NOT NULL,
    "FORdefaut" double precision NOT NULL,
    "Cfor" double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEConfigurationMI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPECreditImpot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPECreditImpot" (
    "idEnumDPECreditImpot" integer NOT NULL,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "valeurCredit" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPECreditImpot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEEconomies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEEconomies" (
    "idEnumereEconomies" integer NOT NULL,
    "libelleEconomies" character varying(30) NOT NULL,
    "valeurEconomies" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEEconomies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEEffortInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEEffortInvestissement" (
    "idEnumereEffortInvestissement" integer NOT NULL,
    "libelleEffortInvestissement" character varying(30) NOT NULL,
    "valeurEffortInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEEffortInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEEmetteur" (
    "idEnumereEmetteur" integer NOT NULL,
    "idTypeEnergie" integer,
    "KEY_emetteur" character varying(10),
    "libelleEmetteur" character varying(150) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEEpaisseurIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEEpaisseurIsolant" (
    "idEnumereEpaisseurIsolant" integer NOT NULL,
    "epaisseurIsolant" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEEpaisseurIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEGroupeRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEGroupeRecommandation" (
    "idGroupeRecommandation" integer NOT NULL,
    "LibelleGroupe" character varying(255),
    "EffortInvestMaxPlage1" integer,
    "EffortInvestMaxPlage2" integer,
    "EffortInvestMaxPlage3" integer,
    "EffortInvestMaxPlage4" integer,
    "EffortInvestMaxPlage5" integer,
    "PictogrammeEffortInvest" bytea,
    "EconomiesMaxPlage1" integer,
    "EconomiesMaxPlage2" integer,
    "EconomiesMaxPlage3" integer,
    "EconomiesMaxPlage4" integer,
    "EconomiesMaxPlage5" integer,
    "PictogrammeEconomies" bytea,
    "RetourInvestMaxPlage1" integer,
    "RetourInvestMaxPlage2" integer,
    "RetourInvestMaxPlage3" integer,
    "RetourInvestMaxPlage4" integer,
    "RetourInvestMaxPlage5" integer,
    "PictogrammeRetourInvest" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumDPEGroupeRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEIauxClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEIauxClimatisation" (
    "idEnumereIauxClimatisation" integer NOT NULL,
    "libelleClim" character varying(50),
    "C" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEIauxClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEId; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEId" (
    "idEnumereId" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    id integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEId" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEInstallationChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEInstallationChauffage" (
    "idInstallationEnergetique" integer NOT NULL,
    "idTypeEnergie" integer,
    "libelleInstallationEnergetique" character varying(150) NOT NULL,
    "notDelete" boolean NOT NULL,
    "Rd" double precision NOT NULL,
    "Re" double precision NOT NULL,
    "Rg" double precision NOT NULL,
    "Rg1" real,
    "Rr" double precision NOT NULL,
    "Rr1" real,
    "NauxCh" smallint,
    "isCentral" boolean NOT NULL,
    "isMI" boolean NOT NULL,
    "isInsert" boolean NOT NULL,
    "Appoint1" real,
    "Appoint2" real,
    "IndColl" character varying(2),
    "canHaveCondensation" boolean,
    "isChauffageEau" boolean,
    "canHaveEmetteurBT" boolean,
    "isAeraulique" boolean,
    "isCollectifElectrique" boolean,
    "isChaudiereCORch" boolean,
    "notRecommandable" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEInstallationChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEInstallationECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEInstallationECS" (
    "idInstallationEnergetique" integer NOT NULL,
    "idTypeEnergie" integer,
    "libelleInstallationEnergetique" character varying(150) NOT NULL,
    "notDelete" boolean NOT NULL,
    "Rs" double precision,
    "Rd" double precision,
    "Rg" double precision,
    "RdBoucle" double precision,
    "Iecs1" real NOT NULL,
    "Iecs2" real,
    libelle1 character varying(50),
    libelle2 character varying(50),
    "canHaveVeilleuse" boolean NOT NULL,
    "isCentral" boolean,
    "isMI" boolean NOT NULL,
    "isInstantane" boolean,
    "isAccumulation" boolean,
    "notRecommandable" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEInstallationECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEIsolant" (
    "idEnumereIsolant" integer NOT NULL,
    "libelleIsolant" character varying(50) NOT NULL,
    classe character varying(15) NOT NULL,
    lambda real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPELameAir; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPELameAir" (
    "idEnumereLameAir" integer NOT NULL,
    "libelleLameAir" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPELameAir" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEMIT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEMIT" (
    "idEnumereMIT" integer NOT NULL,
    "descriptionMIT" character varying(50) NOT NULL,
    "MIT" double precision NOT NULL,
    "MIT2a" double precision NOT NULL,
    "MIT2b" double precision NOT NULL,
    "MIT2c" double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEMIT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEPlageAltitude; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEPlageAltitude" (
    "idEnumerePlageAltitude" integer NOT NULL,
    "libelleClasse" character varying(15) NOT NULL,
    "valeurClasse" integer NOT NULL,
    "minAltitude" integer,
    "maxAltitude" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEPlageAltitude" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEReseauDistribution; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEReseauDistribution" (
    "idEnumereReseauDistribution" integer NOT NULL,
    "KEY_reseauDistribution" character varying(10) NOT NULL,
    "libelleReseauDistribution" character varying(100) NOT NULL,
    "Rd" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEReseauDistribution" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPERetourInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPERetourInvestissement" (
    "idEnumereRetourInvestissement" integer NOT NULL,
    "libelleRetourInvestissement" character varying(30) NOT NULL,
    "valeurRetourInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPERetourInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPESystemeClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPESystemeClimatisation" (
    "idEnumereSystemeClimatisation" integer NOT NULL,
    "idTypeEnergie" integer,
    "KeySystClim" character varying(10) NOT NULL,
    "libelleSystemeClim" character varying(30) NOT NULL,
    "systGaz" boolean NOT NULL,
    "systElectrique" boolean NOT NULL,
    "systCollectif" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPESystemeClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPETypeEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPETypeEclairage" (
    "idEnumereTypeEclairage" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPETypeEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPETypeEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPETypeEquipementDivers" (
    "idEnumereTypeEquipementDivers" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPETypeEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPETypeMenuiserie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPETypeMenuiserie" (
    "idEnumereTypeMenuiserie" integer NOT NULL,
    "libelleMenuiserie" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPETypeMenuiserie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPETypeMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPETypeMur" (
    "idEnumereTypeMur" integer NOT NULL,
    "descriptionMur" character varying(50) NOT NULL,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    kpim double precision NOT NULL,
    kpibme double precision NOT NULL,
    kmen double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPETypeMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPETypeVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPETypeVitrage" (
    "idEnumereTypeVitrage" integer NOT NULL,
    "libelleTypeVitrage" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPETypeVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUfenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUfenetre" (
    "idEnumereUfenetre" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UfenetreSansVolet" real NOT NULL,
    "UfenetreAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUfenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUmur0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUmur0" (
    "idEnumereUmur0" integer NOT NULL,
    "idEnumereTypeMur" integer,
    "epaisseurMur" integer,
    "Umur" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUmur0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUmurD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUmurD" (
    "idEnumereUmurD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UmurD" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUmurD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUmurInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUmurInconnu" (
    "idEnumereUmurInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UmurH1Joule" double precision NOT NULL,
    "UmurH1Autre" double precision NOT NULL,
    "UmurH2Joule" double precision NOT NULL,
    "UmurH2Autre" double precision NOT NULL,
    "UmurH3Joule" double precision NOT NULL,
    "UmurH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUmurInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplafond0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplafond0" (
    "idEnumereUplafond0" integer NOT NULL,
    "descriptionPlafond" character varying(50) NOT NULL,
    "Uplafond0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplafond0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplafondD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplafondD" (
    "idEnumereUplafondD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplafondD" double precision NOT NULL,
    "UplafondDCombleHabites" double precision NOT NULL,
    "UplafondDTerrasse" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplafondD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplafondInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplafondInconnu" (
    "idEnumereUplafondInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "isTerrasse" boolean NOT NULL,
    "UplafondH1Joule" double precision NOT NULL,
    "UplafondH1Autre" double precision NOT NULL,
    "UplafondH2Joule" double precision NOT NULL,
    "UplafondH2Autre" double precision NOT NULL,
    "UplafondH3Joule" double precision NOT NULL,
    "UplafondH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplafondInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplancher0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplancher0" (
    "idEnumereUplancher0" integer NOT NULL,
    "descriptionPlancher" character varying(50) NOT NULL,
    "keyPlancher" character varying(5) NOT NULL,
    "Uplancher0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplancher0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplancherD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplancherD" (
    "idEnumereUplancherD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplancherD" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplancherD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUplancherInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUplancherInconnu" (
    "idEnumereUplancherInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UplancherH1Joule" double precision NOT NULL,
    "UplancherH1Autre" double precision NOT NULL,
    "UplancherH2Joule" double precision NOT NULL,
    "UplancherH2Autre" double precision NOT NULL,
    "UplancherH3Joule" double precision NOT NULL,
    "UplancherH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUplancherInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUporte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUporte" (
    "idEnumereUporte" integer NOT NULL,
    "idEnumereTypeMenuiserie" integer,
    "typePorte" character varying(100) NOT NULL,
    "Uporte" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUporte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEUveranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEUveranda" (
    "idEnumereUveranda" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UverandaSansVolet" real NOT NULL,
    "UverandaAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEUveranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDPEVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDPEVentilation" (
    "idEnumereVentilation" integer NOT NULL,
    "idTypeVentilation" integer,
    "libelleVentilation" character varying(50) NOT NULL,
    "aRA" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDPEVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiCategorieTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiCategorieTravaux" (
    "idCategorie" integer NOT NULL,
    intitule character varying(100),
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiCategorieTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiCommentaireElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiCommentaireElement" (
    "idCommentaire" integer NOT NULL,
    "idElement" integer,
    intitule character varying(100),
    valeur character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiCommentaireElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiElement" (
    "idElement" integer NOT NULL,
    intitule character varying(100),
    "isElementParent" boolean,
    "isSecondOeuvre" boolean,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiEtat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiEtat" (
    "idEtat" integer NOT NULL,
    intitule character varying(100),
    valeur character varying(255),
    "etatCaseACocher" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiEtat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiNature; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiNature" (
    "idNature" integer NOT NULL,
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiNature" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiOuvrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiOuvrage" (
    "idOuvrage" integer NOT NULL,
    intitule character varying(100),
    "categorieOuvrage" character varying(10),
    "isGrosOeuvre" boolean,
    "isCouvert" boolean,
    "isEquipementCommun" boolean,
    "isEquipementSecurite" boolean,
    "isCoduiteCanalisation" boolean,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiOuvrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumDtiTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumDtiTravaux" (
    "idTravaux" integer NOT NULL,
    "idCategorie" integer,
    intitule character varying(100),
    valeur text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumDtiTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumEDLCategorieTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumEDLCategorieTravaux" (
    "idCategorie" integer NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumEDLCategorieTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumEDLNatureObservation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumEDLNatureObservation" (
    "idNature" integer NOT NULL,
    "idObservation" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumEDLNatureObservation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumERNTAerodrome; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumERNTAerodrome" (
    "idAeroport" integer NOT NULL,
    "Dpt" character varying(3),
    "Zone" character varying(50),
    "Intitule" character varying(1000),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumERNTAerodrome" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumERNTArretesPrefectoraux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumERNTArretesPrefectoraux" (
    "idArrete" integer NOT NULL,
    "codePostal" character varying(50),
    "numeroArrete" character varying(50),
    "dateArrete" timestamp without time zone,
    "dateMAJ" timestamp without time zone,
    commentaire text,
    ville character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "numeroArretePeb" character varying(50),
    "dateArretePeb" timestamp without time zone,
    "dateMAJPeb" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumERNTArretesPrefectoraux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumERNTAutresRisquesNaturels; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumERNTAutresRisquesNaturels" (
    "idRisque" integer NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumERNTAutresRisquesNaturels" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumERNTCommentaire; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumERNTCommentaire" (
    "idCommentaire" integer NOT NULL,
    "intituleCommentaire" character varying(100),
    "MemoCommentaire" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumERNTCommentaire" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecConstatation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecConstatation" (
    "idEnumElecConstatation" integer NOT NULL,
    "idEnumElecFicheControl" integer,
    "idEnumElecPointControl" integer,
    "libelleConstatation" character varying(255),
    constatation text,
    "isAuto" boolean,
    "isConstatationDiverse" boolean,
    "isNorme" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer,
    "isNV" boolean
);


ALTER TABLE public."(ADN_DIAG) EnumElecConstatation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecDistributeur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecDistributeur" (
    "idEnumElecDistributeur" integer NOT NULL,
    "libelleDistributeur" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumElecDistributeur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecFicheControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecFicheControl" (
    "idEnumElecFicheControl" integer NOT NULL,
    "numFiche" character varying(16),
    "libelleFiche" character varying(255),
    "natureControl" text,
    "risquesCouverts" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer
);


ALTER TABLE public."(ADN_DIAG) EnumElecFicheControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecPointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecPointControl" (
    "idEnumElecPointControl" integer NOT NULL,
    "idEnumElecFicheControl" integer,
    "numPointControl" character varying(32),
    "libellePointControl" text,
    "libelleAnomalie" text,
    "photoPointControl" bytea,
    exigences text,
    "defautResultat" character varying(16),
    "isMesure" boolean,
    "isCompensatoire" boolean,
    regroupement character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer,
    "isMetallic" boolean,
    "isSDB" boolean,
    "isObligatoire" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) EnumElecPointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecRecommandation" (
    "idEnumElecRecommandation" integer NOT NULL,
    "idEnumElecFicheControl" integer,
    "idEnumElecPointControl" integer,
    "libelleRecommandation" character varying(255),
    recommandation text,
    "isAuto" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isDefaut" boolean
);


ALTER TABLE public."(ADN_DIAG) EnumElecRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElecTypeControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElecTypeControl" (
    "idEnumElecTypeControl" integer NOT NULL,
    "typeControl" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumElecTypeControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElement" (
    "idElement" integer NOT NULL,
    "idCategorieElement" character varying(10),
    "idElementParent" integer,
    intitule character varying(100),
    "isStandard" boolean NOT NULL,
    "categorieAmiante" character varying(255),
    "isSCAmiante" boolean NOT NULL,
    "isSCParasite" boolean NOT NULL,
    "isSCPlomb" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "ObsPlomb" character varying(255),
    "isEquipement" boolean NOT NULL,
    "isAppareil" boolean NOT NULL,
    "idSdl" integer,
    "customFieldAmiante1" character varying(255),
    "customFieldPlomb1" character varying(255),
    "customFieldTermite1" character varying(255),
    "isBati" boolean NOT NULL,
    "categorieBien" character varying(5),
    "idContrat" integer
);


ALTER TABLE public."(ADN_DIAG) EnumElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumElementLocalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumElementLocalisation" (
    "idLocalisation" integer NOT NULL,
    code character varying(10),
    description character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumElementLocalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazAutreAnomalies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazAutreAnomalies" (
    "idEnumereAutreAnomalie" integer NOT NULL,
    "libelleGenre" character varying(50),
    "libelleAnomalie" character varying(255),
    anomalie text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazAutreAnomalies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazCategorieControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazCategorieControl" (
    "idEnumereCategorie" integer NOT NULL,
    article character varying(50),
    "libelleCategorie" character varying(255),
    "natureControl" text,
    "risqueCouvert" text,
    "defautResultat" integer,
    "imageControl" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer
);


ALTER TABLE public."(ADN_DIAG) EnumGazCategorieControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazConstatationDiverses; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazConstatationDiverses" (
    "idEnumereConstatation" integer NOT NULL,
    "idEnumereCategorie" integer,
    "idEnumereFicheControl" integer,
    "libelleConstatation" character varying(255),
    constatation text,
    "idConstatationFixe" character varying(50),
    "constatationFixeCommentaire" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer,
    "isNV" boolean NOT NULL,
    "isAuto" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) EnumGazConstatationDiverses" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazDistributeurGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazDistributeurGaz" (
    "idEnumereDistributeurGaz" integer NOT NULL,
    "libelleDistributeur" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "numTel" character varying(50),
    "numFax" character varying(50),
    mail character varying(255),
    "Commentaire" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) EnumGazDistributeurGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazExigence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazExigence" (
    "idEnumereExigence" integer NOT NULL,
    "idEnumereFicheControl" integer,
    "libelleExigence" text,
    "isLogementCollectif" boolean,
    "isMaisonIndividuelle" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazExigence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazFicheControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazFicheControl" (
    "idEnumereFicheControl" integer NOT NULL,
    "idEnumereCategorie" integer,
    "idEnumereTypeAnomalie" integer,
    "numeroFiche" character varying(8),
    "libelleAnomalie" text,
    "numeroControl" character varying(8),
    "libelleCritereDecision" text,
    "activeValueAnomalie" boolean NOT NULL,
    "defautResultat" integer,
    "imageControl" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer
);


ALTER TABLE public."(ADN_DIAG) EnumGazFicheControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazGenre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazGenre" (
    "libelleGenre" character varying(50) NOT NULL,
    "isChauffeEau" boolean,
    "isCuisson" boolean,
    "isChauffage" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazGenre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazLocalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazLocalisation" (
    "idEnumereLocation" integer NOT NULL,
    "libelleLocalisation" character varying(50),
    "Localisation" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazLocalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazMarque; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazMarque" (
    "libelleMarque" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazMarque" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazMateriaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazMateriaux" (
    "idEnumereMateriaux" integer NOT NULL,
    "libelleMateriaux" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazMateriaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazModele" (
    "idEnumereModele" integer NOT NULL,
    "libelleGenre" character varying(50),
    "libelleMarque" character varying(50),
    "libelleModele" character varying(50),
    puissance double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazNatureGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazNatureGaz" (
    "idEnumereNatureGaz" integer NOT NULL,
    "libelleNatureGaz" character varying(50),
    "codeNatureGaz" character varying(50),
    "isNaturel" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazNatureGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazRecommandation" (
    "idEnumereRecommandation" integer NOT NULL,
    "idEnumereFiche" integer,
    "idEnumereFicheControl" integer,
    "libelleRecommandation" character varying(255),
    recommandation text,
    "isDefaut" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer
);


ALTER TABLE public."(ADN_DIAG) EnumGazRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazTypeAnomalie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazTypeAnomalie" (
    "idEnumereTypeAnomalie" integer NOT NULL,
    "libelleAnomalie" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazTypeAnomalie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazTypeDistribution; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazTypeDistribution" (
    "idEnumereTypeDistribution" integer NOT NULL,
    "libelleTypedistribution" character varying(50),
    "isRecipient" boolean,
    "isBassePression" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazTypeDistribution" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazTypeGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazTypeGaz" (
    "idEnumereTypeGaz" integer NOT NULL,
    "libelleTypeGaz" character varying(50),
    "isNaturel" boolean,
    "tauxConversionCENR" real,
    "tauxConversionNF" real,
    "tauxConversionCE" real,
    "valThDefaut" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazTypeGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazTypeInstallation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazTypeInstallation" (
    "idEnumereTypeInstallation" integer NOT NULL,
    "libelleTypeInstallation" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazTypeInstallation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumGazTypeRaccordement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumGazTypeRaccordement" (
    "idEnumereTypeRaccordement" integer NOT NULL,
    "libelleRaccordement" character varying(50),
    "isDureeVieIllimite" boolean,
    "isAppChaufageFixeValide" boolean,
    "isAppChauffageMobileValideB" boolean,
    "isAppChauffageMobileValideP" boolean,
    "isAppCuissonEncastreValideB" boolean,
    "isAppCuissonEncastreValideP" boolean,
    "isAppCuissonLibreAncienValideB" boolean,
    "isAppCuissonLibreAncienValideP" boolean,
    "isAppCuissonLibreNeufValideB" boolean,
    "isAppCuissonLibreNeufValideP" boolean,
    "imageRaccord" bytea,
    "isAdapteGPL" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumGazTypeRaccordement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumIFTAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumIFTAppareil" (
    "idEnumIFTAppareil" integer NOT NULL,
    nom character varying(255),
    marque character varying(255),
    modele character varying(255),
    "numSerie" character varying(255),
    fabriquant character varying(255),
    fournisseur character varying(255),
    "dateEtalonnage" timestamp without time zone,
    "isDefaut" boolean NOT NULL,
    "PortCom" character varying(6),
    "idSiteGestion" character varying(50),
    "idresPhoto" uuid,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "previewDataPhoto" bytea,
    "discAppareil" character varying(1),
    "typeMarque" character varying(50),
    "typeModele" character varying(50),
    "idSociete" character varying(50) NOT NULL,
    emplacement text,
    "dateFin" timestamp without time zone,
    "commentaireFin" character varying(255),
    "missionCible" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) EnumIFTAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumIFTFuite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumIFTFuite" (
    "idEnumIFTFuite" integer NOT NULL,
    type integer,
    code character varying(5),
    libelle character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumIFTFuite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumIFTLabelAutre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumIFTLabelAutre" (
    "idIFTLabelAutre" integer NOT NULL,
    "idIFTLabel" integer NOT NULL,
    "typeUsage" character varying(50),
    intitule character varying(50),
    valeur double precision,
    logo bytea,
    commentaire text,
    "dateFinValidite" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isAfficher" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) EnumIFTLabelAutre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumIFTOuverture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumIFTOuverture" (
    "idEnumIFTOuverture" integer NOT NULL,
    type integer,
    libelle character varying(255),
    "isDefaut" boolean NOT NULL,
    "resultQ4" integer,
    "resultA" integer,
    "resultB" integer,
    "etatDefaut" integer,
    "justificationDefaut" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    disc character varying(5),
    "etatES" character varying(50),
    "precision" character varying(255),
    "idParent" integer,
    "idNorme" integer
);


ALTER TABLE public."(ADN_DIAG) EnumIFTOuverture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumLocal" (
    "idLocal" integer NOT NULL,
    intitule character varying(100),
    "isStandard" boolean NOT NULL,
    "categorieLocal" character varying(2),
    "idTypeLocalNSH" character varying(50),
    "isPieceHumide" boolean,
    "isSDB" boolean,
    "isWC" boolean,
    "isCuisine" boolean,
    "isSomeil" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "categorieBien" character varying(5),
    "idContrat" integer,
    code character varying(50)
);


ALTER TABLE public."(ADN_DIAG) EnumLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumMateriau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumMateriau" (
    "idMateriau" integer NOT NULL,
    "idFamilleMateriau" character varying(10) NOT NULL,
    intitule character varying(100),
    "isRevetement" boolean NOT NULL,
    "typeCFA" character varying(2),
    "obsPlomb" character varying(255),
    "isSCAmiante" boolean NOT NULL,
    "isSCParasite" boolean NOT NULL,
    "isSCPlomb" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isPlancher" boolean NOT NULL,
    "isListeA" boolean NOT NULL,
    "isListeB" boolean NOT NULL,
    "isListeC" boolean NOT NULL,
    "isListeR" boolean NOT NULL,
    "typeGE" character varying(2),
    "customFieldAmiante1" character varying(255),
    "customFieldPlomb1" character varying(255),
    "customFieldTermite1" character varying(255),
    "isBati" boolean NOT NULL,
    "categorieBien" character varying(5),
    "idContrat" integer
);


ALTER TABLE public."(ADN_DIAG) EnumMateriau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumMissionConclusion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumMissionConclusion" (
    "idConlusion" integer NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    intitule character varying(255),
    conclusion text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "discConclusion" integer
);


ALTER TABLE public."(ADN_DIAG) EnumMissionConclusion" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumMissionPdc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumMissionPdc" (
    "idEnumMissionPdc" integer NOT NULL,
    "idParent" integer,
    "typeMissionPdc" character varying(10),
    "idCategorieMission" character varying(50),
    "idTypeMission" character varying(50),
    "idContrat" integer,
    "discMissionPdc" character varying(15),
    intitule character varying(500),
    "precision" character varying(500),
    ordre integer,
    "statutDefaut" integer,
    "isAjoutDefaut" boolean NOT NULL,
    "isUserParam" boolean NOT NULL,
    "isAjoutDocDefaut" boolean NOT NULL,
    "typeDocDefaut" character varying(255),
    "titreDocDefaut" character varying(255),
    "origineDocDefaut" character varying(255),
    "objetDocDefaut" character varying(255),
    "commentaireDocDefaut" text,
    "idResDocDefaut" uuid,
    "previewDataDocDefaut" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumMissionPdc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumModele" (
    "idModele" integer NOT NULL,
    "idCategorieMission" character varying(50),
    "typeModele" character varying(10),
    nom character varying(255),
    "isDefaut" boolean,
    "DBMajorVersion" integer,
    "DBMinorVersion" integer,
    "XmlData" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumModeleDocRemis; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumModeleDocRemis" (
    "idEnumModeleDocRemis" integer NOT NULL,
    "idEnumMissionPdc" integer,
    "discModeleDocRemis" character varying(15),
    "typeDocDefaut" character varying(255),
    "titreDefaut" character varying(255),
    "origineDefaut" character varying(255),
    "objetDefaut" character varying(255),
    "commentaireDefaut" text,
    "resumeDefaut" text,
    ordre integer,
    "isAjoutDefaut" boolean,
    "isUserParam" boolean,
    "idResDocument" uuid,
    "previewDataDocument" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumModeleDocRemis" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumNSHCategorie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumNSHCategorie" (
    "idCategorie" integer NOT NULL,
    "typeCategorie" integer,
    "libelleCategorie" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumNSHCategorie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumNSHCategorieLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumNSHCategorieLocal" (
    "idCategoriePiece" integer NOT NULL,
    "libelleCategorie" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumNSHCategorieLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumNSHCommentaire; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumNSHCommentaire" (
    "idCommentaire" integer NOT NULL,
    "typeCategorie" integer,
    commentaire text,
    libelle character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumNSHCommentaire" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRACategorie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRACategorie" (
    "idCategorie" integer NOT NULL,
    "intituleCategorie" character varying(255),
    ordre integer,
    "isGenerique" boolean,
    icone character varying(255),
    referent boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumPRACategorie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRAChapitreDeclaProprio; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRAChapitreDeclaProprio" (
    "idChapitre" integer NOT NULL,
    intitule character varying(255),
    ordre smallint,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumPRAChapitreDeclaProprio" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRACommConstatsNiveau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRACommConstatsNiveau" (
    "idCommConstatsNiveau" integer NOT NULL,
    "idCategorie" integer,
    "idElement" integer,
    "idSousElement" integer,
    titre character varying(255),
    texte text,
    discriminant integer NOT NULL,
    "intituleCategorie" character varying(255),
    "intituleElement" character varying(255),
    "intituleSousElement" character varying(255),
    ordre integer,
    type character varying(255),
    gravite character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRACommConstatsNiveau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRAElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRAElement" (
    "idElement" integer NOT NULL,
    "idCategorie" integer,
    "intituleElement" character varying(255),
    "intituleCategorie" character varying(255),
    ordre integer,
    icone character varying(255),
    referent boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumPRAElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRAGravite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRAGravite" (
    "idGravite" integer NOT NULL,
    gravite character varying(255),
    ordre smallint,
    "Description" character varying(255),
    police character varying(50),
    italic boolean,
    bold boolean,
    taille real,
    "effetBarre" boolean,
    "effetSouligne" boolean,
    script real,
    "A" integer,
    "R" integer,
    "G" integer,
    "B" integer,
    "idResIco" uuid,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRAGravite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRAHierarchie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRAHierarchie" (
    "idHierarchie" integer NOT NULL,
    hierarchie integer,
    titre character varying(255),
    texte text,
    "A" integer,
    "R" integer,
    "G" integer,
    "B" integer,
    police character varying(50),
    italic boolean,
    bold boolean,
    taille real,
    "effetBarre" boolean,
    "effetSouligne" boolean,
    script real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRAHierarchie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRALibIco; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRALibIco" (
    "idLib" integer NOT NULL,
    "libIco" character varying(255),
    "idResPhoto" uuid,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRALibIco" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRAQuestionDeclaProprio; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRAQuestionDeclaProprio" (
    "idQuesion" integer NOT NULL,
    "idChapitre" integer,
    question text,
    ordre smallint,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRAQuestionDeclaProprio" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRASousElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRASousElement" (
    "idSousElement" integer NOT NULL,
    "idElement" integer,
    "intituleSousElement" character varying(255),
    "intituleElement" character varying(255),
    ordre integer,
    icone character varying(255),
    referent boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumPRASousElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRATexteDefaut; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRATexteDefaut" (
    "idTexteDefaut" integer NOT NULL,
    "idCategorie" integer,
    texte text,
    "isDefaut" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRATexteDefaut" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRATitreDocument; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRATitreDocument" (
    "idTitre" integer NOT NULL,
    "Titre" character varying(255),
    "IdResDoc" uuid,
    "previewData" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRATitreDocument" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRATypeAnnexe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRATypeAnnexe" (
    "idTypeAnnexe" integer NOT NULL,
    "typeAnnexe" character varying(255),
    visible boolean,
    "paramVisible" boolean,
    ordre smallint,
    titre character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRATypeAnnexe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPRATypeCommentaire; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPRATypeCommentaire" (
    "idType" integer NOT NULL,
    type character varying(255),
    police character varying(50),
    italic boolean,
    bold boolean,
    taille real,
    "effetBarre" boolean,
    "effetSouligne" boolean,
    script real,
    "A" integer,
    "R" integer,
    "G" integer,
    "B" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumPRATypeCommentaire" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumPlombNatureDeg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumPlombNatureDeg" (
    "idEnumPlombNatureDeg" integer NOT NULL,
    "idCategorieMission" character varying(50),
    code character varying(5),
    description character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "natureDegDefaut" character varying(100)
);


ALTER TABLE public."(ADN_DIAG) EnumPlombNatureDeg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumQAIElementEval; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumQAIElementEval" (
    "discriminantElement" integer NOT NULL,
    "discriminantSpecifique" character varying(15),
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idNorme" integer,
    "idGroupe" integer,
    "discriminantZone" character varying(10),
    "isExigeZone" boolean NOT NULL,
    intitule text,
    "precision" text,
    logo bytea,
    "typeValeur" character varying(10),
    "valeurNumDefaut" real,
    "valeurTxtDefaut" text,
    "valeurDateDefaut" timestamp without time zone,
    "ordreOriginal" integer,
    "isHidden" boolean NOT NULL,
    "isEditable" boolean NOT NULL,
    "reportingKeyWord" character varying(50),
    "ReportingBookmark" character varying(50),
    "isControlValidation" boolean,
    "idTypeTxtStandard" character varying(50),
    "isParametrableByUser" boolean NOT NULL,
    "valeurNumWarning" real,
    "valeurNumMaxWarning" real,
    "valeurNumPositif" real,
    "valeurNumMaxPositif" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    numero character varying(10),
    "valeurUnite" character varying(10),
    "attPerso1" character varying(100),
    "attPerso2" character varying(100),
    "attPerso3" character varying(100),
    "attPerso4" character varying(100),
    "attPerso5" character varying(100),
    "attPerso6" character varying(100),
    "attPerso7" character varying(100),
    "isMesure" boolean NOT NULL,
    "isHumide" boolean,
    "isPlageMesure" boolean NOT NULL,
    "discriminantTypeMesure" character varying(5),
    "typeHygro" character varying(5),
    "discriminantValueParam" character varying(50),
    "discriminantTypeEquipement" character varying(50),
    "versionProtocole" character varying(20)
);


ALTER TABLE public."(ADN_DIAG) EnumQAIElementEval" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumQAIGroupe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumQAIGroupe" (
    "idGroupe" integer NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idNorme" integer,
    "typeGroupe" character varying(10) NOT NULL,
    numero character varying(10),
    ordre integer,
    intitule text,
    "precision" text,
    "isApplicableZone" boolean NOT NULL,
    "idParent" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "versionProtocole" character varying(20)
);


ALTER TABLE public."(ADN_DIAG) EnumQAIGroupe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumQAIZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumQAIZone" (
    "discriminantZone" character varying(10) NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "idNorme" integer,
    intitule character varying(255),
    ordre integer,
    hierarchie integer,
    "isDefaut" boolean NOT NULL,
    "isUnique" boolean,
    "isHidden" boolean,
    "hasChildZones" boolean,
    logo bytea,
    "isCapacite" boolean NOT NULL,
    "defautCapacite" real,
    "libelleCapacite" character varying(100),
    "uniteCapacite" character varying(50),
    "isNumerotationAuto" boolean,
    "isObsolete" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumQAIZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumQAIintituleZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumQAIintituleZone" (
    "idIntituleZone" integer NOT NULL,
    "discriminantZone" character varying(10) NOT NULL,
    intitule character varying(255),
    ordre integer,
    "isNumerotationAuto" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumQAIintituleZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumTermiteDegradation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumTermiteDegradation" (
    "idDegradation" integer NOT NULL,
    "intituleAbrege" character varying(50),
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumTermiteDegradation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumTermiteFamilleParasite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumTermiteFamilleParasite" (
    "idFamille" integer NOT NULL,
    "intituleAbrege" character varying(50),
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumTermiteFamilleParasite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumTermiteParasite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumTermiteParasite" (
    "idParasite" integer NOT NULL,
    "intituleAbrege" character varying(50),
    intitule character varying(255),
    "idFamille" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG) EnumTermiteParasite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumTermiteTxtAuto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumTermiteTxtAuto" (
    "idTexte" integer NOT NULL,
    intitule character varying(255),
    "isDebut" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumTermiteTxtAuto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumTxtStandard; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumTxtStandard" (
    "idTxtStandard" integer NOT NULL,
    intitule character varying(4000),
    valeur text,
    "idCategorieMission" character varying(50),
    "idType" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "idParent" integer,
    "idContrat" integer,
    disc1 text,
    disc2 text,
    disc3 text,
    disc4 text,
    disc5 text,
    disc6 text,
    disc7 text,
    disc8 text,
    "valNum1" real,
    "valNum2" real,
    "valNum3" real,
    "valNum4" real,
    "idResDoc" uuid,
    "previewDataDoc" bytea,
    "titreDoc" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) EnumTxtStandard" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumVpeElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumVpeElement" (
    "idElement" integer NOT NULL,
    "idElementParent" integer,
    "idCategorieElement" character varying(10),
    intitule character varying(100),
    "isElementTableau" boolean,
    "isProtection" boolean,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumVpeElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumVpeObservation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumVpeObservation" (
    "idEnumVpeObservation" integer NOT NULL,
    "texteObservation" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumVpeObservation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumVpePointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumVpePointControl" (
    "idEnumVpePointControl" integer NOT NULL,
    "numeroSection" integer,
    "libelleSection" character varying(500),
    "numeroCategorie" integer,
    "libelleCategorie" character varying(500),
    "numeroArticle" character varying(50),
    "libelleArticle" character varying(500),
    "texteArticle" text,
    "catERP" integer,
    "idNorme" integer,
    "isDefaut" boolean,
    ordre integer,
    statut integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumVpePointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumVpePreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumVpePreconisation" (
    "idEnumVpePreconisation" integer NOT NULL,
    "textePreconisation" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumVpePreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) EnumZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) EnumZone" (
    "idZone" integer NOT NULL,
    intitule character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) EnumZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Gaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Gaz" (
    "idMission" integer NOT NULL,
    "idEnumereNatureGaz" integer,
    "idExpert" integer,
    "distributeurGaz" character varying(255),
    "methodeUtilise" character varying(50),
    "versionMethode" character varying(50),
    resultat character varying(50),
    "dateFinValid" timestamp without time zone,
    "numEnregistrement" character varying(255),
    "numCompteur" character varying(255),
    "indexCompteur" character varying(255),
    "isAlimentationGaz" boolean,
    "isGenererPhoto" boolean,
    "isGenererGrilleCtrl" boolean,
    "isGenererLocalisation" boolean,
    "isGenererRisques" boolean,
    "isModeTerrain" boolean,
    "ChangeTime" timestamp without time zone,
    "isGenererEtiq" boolean,
    "isGenererLprop" boolean,
    "isGenererLdistr" boolean,
    "isGenererFicheDistributeur" boolean,
    "libelleInfoEnregistrement" character varying(255),
    "numTelDistributeur" character varying(50),
    "numFaxDistributeur" character varying(50),
    "mailDistributeur" character varying(255),
    "fermetureTotal" boolean,
    "fermeturePartielle" boolean,
    "isTransmisDistrib" boolean,
    "moyenTransmisDistrib" character varying(255),
    "isTransmisDistNeed" boolean,
    "numContrat" character varying(255),
    "idTitulaireContrat" integer,
    "isControlVacuite" boolean NOT NULL,
    "isJustifEntretienChaudiere" boolean NOT NULL,
    "isRemiseFicheDistributeurDgi" boolean,
    "numEnregistrement32c" character varying(255),
    "isRemiseFicheDistributeur32c" boolean,
    "isGenererLsyndic" boolean,
    "isConduitNonVisitable" boolean NOT NULL,
    "isTransmisDistrib32c" boolean,
    "moyenTransmisDistrib32c" character varying(255),
    "dateInstallationTxt" character varying(50),
    "isRaccordMecaRub" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) Gaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazAnomalies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazAnomalies" (
    "idAnomalie" integer NOT NULL,
    "idMission" integer,
    "idAppareil" integer,
    "libelleCategorie" character varying(255),
    "numeroControl" character varying(8),
    "typeAnomalie" character varying(50),
    "libelleAnomalie" text,
    recommandation text,
    "intitulePhoto" text,
    "cheminPhoto" character varying(255),
    "risqueEncourus" text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) GazAnomalies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazAppareil" (
    "idAppareil" integer NOT NULL,
    "idEnumereTypeInstallation" integer,
    "idEnumereTypeRaccordement" integer,
    "idLocal" integer,
    "idInstallation" integer,
    "libelleGenre" character varying(50),
    marque character varying(50),
    "libelleAppareil" character varying(50),
    modele character varying(50),
    type character varying(50),
    "puissanceKW" double precision,
    localisation character varying(50),
    anomalie text,
    "debitGazTheorique" double precision,
    "debitGazMesure" double precision,
    "tauxCOMesureArret" double precision,
    "tauxCOMesureFct" double precision,
    "tirageMesure" double precision,
    "isC5Respecte" boolean,
    "isChauffageMobile" boolean,
    "isAppCuissonEncastre" boolean,
    "isRaccordConduitFumee" boolean,
    "isNF" boolean,
    "isCE" boolean,
    "isElectric" boolean,
    "isVisite" boolean,
    justification text,
    "isDebordFlamme" boolean,
    "isSecurite" boolean,
    "isTigeCuisine" boolean,
    "intitulePhoto" text,
    "cheminPhoto" character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "isSurveilFlam" boolean,
    "isCoupeTirageSsVentilateur" boolean
);


ALTER TABLE public."(ADN_DIAG) GazAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazConstatationsDiverses; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazConstatationsDiverses" (
    "idConstatation" integer NOT NULL,
    "idMission" integer,
    "idEnumereFicheControl" integer,
    "idEnumereCategorie" integer,
    "libelleConstatation" text
);


ALTER TABLE public."(ADN_DIAG) GazConstatationsDiverses" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazInstallation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazInstallation" (
    "idInstallation" integer NOT NULL,
    "idMission" integer,
    "idEnumereTypedistribution" integer,
    "idEnumereMateriaux" integer,
    "idEnumereTypeGaz" integer,
    "idEnumereNatureGaz" integer,
    "libelleInstallation" character varying(50),
    "isCompteurPresent" boolean,
    "debitMesure" double precision,
    "isEspaceAnnulaireVisible" boolean,
    "isRaccordRigide" boolean,
    "isNeuf" boolean,
    "intitulePhoto" text,
    "cheminPhoto" character varying(255),
    "distributeurGaz" character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) GazInstallation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazLocal" (
    "idLocal" integer NOT NULL,
    "idMission" integer,
    "idDossierLocal" uuid,
    "libelleLocal" character varying(100),
    surface double precision,
    "HSP" double precision,
    "volumeSaisie" double precision,
    "isAlveoleTechGaz" boolean,
    "isAmeneeAirDirect" boolean,
    "isSortieAirDirect" boolean,
    "tailleOuvertureAmeneeAir" double precision,
    "tailleOuvertureSortieAir" double precision,
    "nbModuleAmeneeAir" integer,
    "nbModuleSortieAir" integer,
    "isC1Respecte" boolean,
    "isC2Respecte" boolean,
    "isC3Respecte" boolean,
    "isC4Respecte" boolean,
    "tailleOuvrantExt" double precision,
    visite boolean,
    justification text,
    "isHumide" boolean,
    "hauteurAmeneeAir" double precision,
    "hauteurSortieAir" double precision,
    "nbPieceIntermediaire" integer,
    "intitulePhoto" text,
    "cheminPhoto" character varying(255),
    "isVMC" boolean,
    "isVMCGAZ" boolean,
    "isEntreAir" boolean,
    "isSortieAir" boolean,
    "isHoteAspirante" boolean,
    "isTransitAmeneeAir" boolean,
    etage character varying(50),
    niveau real,
    ordre integer,
    numero character varying(50),
    code character varying(50),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "IsExtractMeca" boolean NOT NULL,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) GazLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazParamGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazParamGeneral" (
    "idParamDossier" integer NOT NULL,
    "isGenererGrilleCtrl" boolean,
    "isActiverAutomatisme" boolean,
    "isActiverFiltrage" boolean,
    "cheminGeneration" character varying(255),
    "versionMethode" character varying(50),
    methode character varying(50),
    "isGenererPhoto" boolean,
    "isGenererLocalisation" boolean,
    "isModeTerrainDefaut" boolean,
    "isGenererRisque" boolean,
    "NbDecimalGen" integer,
    "imageDirectoryPath" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idNorme" integer,
    "isAutoEtiqDGI" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) GazParamGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazPhoto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazPhoto" (
    "idPhoto" integer NOT NULL,
    "idAnomalie" integer,
    "intitulePhoto" text,
    "cheminPhoto" character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) GazPhoto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazRelAnoApp; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazRelAnoApp" (
    "idRel" integer NOT NULL,
    "idAnomalie" integer,
    "idAppareil" integer,
    "idLocal" integer,
    "idInstallation" integer
);


ALTER TABLE public."(ADN_DIAG) GazRelAnoApp" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) GazResultControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) GazResultControl" (
    "idResultControl" integer NOT NULL,
    "idMission" integer,
    "idEnumereFicheControl" integer,
    "idEnumereTypeAnomalie" integer,
    "isGenereAuto" boolean,
    "isActif" boolean,
    "isNV" boolean NOT NULL,
    justification text
);


ALTER TABLE public."(ADN_DIAG) GazResultControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFT" (
    "idMission" integer NOT NULL,
    "idNorme" integer,
    hauteur double precision,
    "vitessVent" double precision,
    "forceVent" integer,
    methode character varying(15),
    "isPressionAlti" boolean NOT NULL,
    altitude double precision,
    pression double precision,
    "typeBatiment" character varying(50),
    "typeUsage" character varying(50),
    "isBatimentEntier" boolean NOT NULL,
    "isBBC" boolean NOT NULL,
    "idIFTLabel" integer,
    objectif character varying(50),
    "objectifValue" double precision,
    "justifObjectif" text,
    "infoComp" text,
    "isChantier" boolean NOT NULL,
    "isReception" boolean NOT NULL,
    "isReglementaire" boolean,
    "justifNonRegle" text,
    volume double precision,
    "incertVolume" double precision,
    "aireNet" double precision,
    "surfDep" double precision,
    "incertSurfDep" double precision,
    "justifSurfDep" text,
    "modeConstructif" character varying(255),
    "materiauxBat" character varying(255),
    "isolationBat" character varying(255),
    "ventilSystem" character varying(255),
    "ventilMoteur" character varying(255),
    chauffage character varying(255),
    refroidissement character varying(255),
    "isGenererAnx" boolean NOT NULL,
    "isGenererPhoto" boolean NOT NULL,
    "isGenererFuiteLocal" boolean NOT NULL,
    "isGenererCalculSurf" boolean NOT NULL,
    "isSyntheseET" boolean NOT NULL,
    "isEchantillon" boolean NOT NULL,
    "nbLogements" integer,
    "niveauMin" real,
    "niveauMax" real,
    "resultatQ4PaSurf" double precision,
    "regleEchant" text,
    "regleJustif" text,
    "isGenererAutresDocuments" boolean NOT NULL,
    "isGenererCertificatCompetence" boolean NOT NULL,
    "isGenererAssurance" boolean NOT NULL,
    "stationMeteo" character varying(255),
    "isBatEnCoursUtilisation" boolean,
    "isHorsReglementation" boolean,
    "isSyntheseETVolume" boolean,
    "justifVolume" text,
    "isGenererEtalonnage" boolean,
    "infoPrisePressionExt" character varying(500),
    "nbNiveauxBat" double precision,
    "sysAireSpecifique" text,
    "isPartiesCom" boolean,
    "pressionNivMer" double precision,
    "coeffPC" double precision,
    "isUseDescBatCommun" boolean,
    "isAltitudeApproximative" boolean,
    "isGenererProtocoleControle" boolean,
    "surfRT" double precision,
    "isTravauxAffecPermAprLiv" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) IFT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTAppareil" (
    "idIFTApp" integer NOT NULL,
    "idMission" integer,
    nom character varying(255),
    marque character varying(255),
    modele character varying(255),
    "numSerie" character varying(255),
    fabriquant character varying(255),
    fournisseur character varying(255),
    "dateEtalonnage" timestamp without time zone,
    "portCom" character varying(6),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    emplacement text,
    "discAppareil" character varying(1),
    "typeMarque" character varying(50),
    "typeModele" character varying(50),
    "idEnumIFTAppareil" integer,
    "isMaitre" boolean NOT NULL,
    "idCouplage" integer,
    "idZone" character varying(10),
    "idIFTAppMaitre" integer NOT NULL,
    "titreEtalonnage" character varying(100),
    "numeroEtalonnage" character varying(100),
    "organismeEtalonnage" character varying(255),
    "idInterlocuteurEtalonnage" integer,
    "dureeValiditeMoisEtalonnage" integer,
    "commentaireEtalonnage" text,
    "idResCertifEtalonnage" uuid,
    "previewDataCertifEtalonnage" bytea,
    "titreCertifEtalonnage" character varying(255),
    "idResConstatVerification" uuid,
    "previewDataConstatVerification" bytea,
    "titreConstatVerification" character varying(255),
    "plageEtalonnage" character varying(255),
    "programmeEtalonnageMin" text,
    "erreurMaxTolere" character varying(255),
    "idIFTZone" uuid,
    "uniteCoef" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) IFTAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTCoefEtalonnage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTCoefEtalonnage" (
    "idCoefEtalonnage" integer NOT NULL,
    "idIFTApp" integer,
    "typeCoef" character varying(50) NOT NULL,
    "idRange" character varying(25),
    intitule character varying(150),
    valeur double precision,
    ordre integer
);


ALTER TABLE public."(ADN_DIAG) IFTCoefEtalonnage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTCommentaireType; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTCommentaireType" (
    "idIFTCommentaireType" integer NOT NULL,
    "idMission" integer,
    code character varying(5),
    commentaire text,
    "idIFTZone" uuid
);


ALTER TABLE public."(ADN_DIAG) IFTCommentaireType" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTEssai; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTEssai" (
    "idIFTEssai" integer NOT NULL,
    "idMission" integer,
    "isValide" boolean,
    "isIncludeGen" boolean,
    "vitesseVent" double precision,
    "isBeaufort" boolean NOT NULL,
    "valeurBeaufort" integer,
    "tempIntPre" double precision,
    "tempExtPre" double precision,
    "tempIntIn" double precision,
    "tempExtIn" double precision,
    "tempIntPost" double precision,
    "tempExtPost" double precision,
    "humiditeInt" double precision,
    "humiditeExt" double precision,
    type character varying(50),
    "isPalierCroissant" boolean NOT NULL,
    "isPalierDecroissant" boolean NOT NULL,
    n double precision,
    "nPlus" double precision,
    "nMoins" double precision,
    "Cenv" double precision,
    "CenvPlus" double precision,
    "CenvMoins" double precision,
    "Cl" double precision,
    "ClPlus" double precision,
    "ClMoins" double precision,
    "Correlation" double precision,
    "V50" double precision,
    "V50Plus" double precision,
    "V50Moins" double precision,
    n50 double precision,
    "n50Plus" double precision,
    "n50Moins" double precision,
    "V4" double precision,
    "V4Plus" double precision,
    "V4Moins" double precision,
    "Q4PaSurf" double precision,
    "Q4PaSurfPlus" double precision,
    "Q4PaSurfMoins" double precision,
    "AireEqQ4PaSurf" double precision,
    "deltaP01" double precision,
    "deltaP01Plus" double precision,
    "deltaP01Moins" double precision,
    "deltaP02" double precision,
    "deltaP02Plus" double precision,
    "deltaP02Moins" double precision,
    "DateHeure" timestamp without time zone,
    "idResImageResult" uuid,
    "V50Press" double precision,
    "V50Depress" double precision,
    "isPress" boolean NOT NULL,
    "isDepress" boolean NOT NULL,
    "idEssaiAssoc" integer,
    "justifTemp" text,
    "justifVent" text,
    "justifDeltaP0" text,
    "justifMesure" text,
    "justifMesureMax" text,
    "justifMesureMin" text,
    "justifV4" text,
    "pressionAtm" double precision,
    "dateDernierCalcul" timestamp without time zone,
    "typeFichierImport" character varying(50),
    "margeStab" double precision,
    "nbMesureAuto" integer,
    "nbMesureCapture" integer,
    "intervalMesAuto" double precision,
    "stab1Duree" integer,
    "stab1Tolerance" integer,
    "stab2Duree" integer,
    "stab2Tolerance" integer,
    "isMultiVentilo" boolean NOT NULL,
    "dureePalierSec" double precision,
    "deltaMesureMin" double precision,
    "methodeHomogeneite" text,
    "idIFTZone" uuid,
    "isResultatHR" boolean,
    "isVentAuSol" boolean,
    "isReleveHomogeneite" boolean,
    "Q4PaSurfAvtPenalite" double precision
);


ALTER TABLE public."(ADN_DIAG) IFTEssai" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTFuite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTFuite" (
    "idIFTFuite" integer NOT NULL,
    "idMission" integer,
    "idIFTLocal" integer,
    numero integer,
    type integer,
    libelle character varying(255),
    importance character varying(50),
    commentaire text,
    code character varying(5),
    "modeConsta" character varying(255),
    "isPress" boolean,
    "isDepress" boolean,
    "idIFTZone" uuid
);


ALTER TABLE public."(ADN_DIAG) IFTFuite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTLabel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTLabel" (
    "idIFTLabel" integer NOT NULL,
    "typeUsage" character varying(50),
    intitule character varying(50),
    valeur double precision,
    logo bytea,
    commentaire text,
    "isAfficher" boolean NOT NULL,
    "dateFinValidite" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isActif" boolean NOT NULL,
    "coeffPC" double precision,
    "ValeurMaxEtiquette" double precision,
    "isHorsReglementation" boolean
);


ALTER TABLE public."(ADN_DIAG) IFTLabel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTLigneProtocoleControle; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTLigneProtocoleControle" (
    "idLigneProtocole" integer NOT NULL,
    "idProtocole" integer,
    ordre integer,
    intitule text,
    "typeValeur" character varying(10),
    "valeurNum" real,
    "valeurTxt" text
);


ALTER TABLE public."(ADN_DIAG) IFTLigneProtocoleControle" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTLocal" (
    "idIFTLocal" integer NOT NULL,
    "idMission" integer,
    "idDossierLocal" uuid,
    "isInclu" boolean NOT NULL,
    ordre integer,
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean NOT NULL,
    justification text,
    commentaire text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) IFTLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMGDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMGDossier" (
    "idIMission" integer NOT NULL,
    "Q4PaSurfTotal" double precision,
    "dateDossier" timestamp without time zone,
    reference character varying(255),
    "isGenererAnx" boolean NOT NULL,
    "isGenererPhoto" boolean NOT NULL,
    "isGenererFuiteLocal" boolean NOT NULL,
    "isGenererCalcSurf" boolean NOT NULL,
    "niveauMax" integer,
    "surfaceDepTotal" double precision,
    "hasAscenseur" boolean NOT NULL,
    "nbLogement" integer,
    "regleEchant" character varying(255),
    "regleJustif" text
);


ALTER TABLE public."(ADN_DIAG) IFTMGDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMGParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMGParam" (
    "idIFTMGParam" integer NOT NULL,
    "nbDecimal" integer,
    "isGenererAnx" boolean NOT NULL,
    "isGenererPhoto" boolean NOT NULL,
    "isGenererFuiteLocal" boolean NOT NULL,
    "isGenererCalcSurf" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTMGParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMGRel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMGRel" (
    "idIFTMGRel" integer NOT NULL,
    "idMission" integer,
    "guidSdlDossierEchantillon" uuid,
    "Intitule" character varying(255),
    "P" double precision,
    "PV" double precision,
    "Sh" double precision,
    "Q4PaSurf" double precision,
    "Atbat" double precision,
    "hasVoletRoulant" boolean NOT NULL,
    niveau real,
    "hauteurSPlafond" double precision,
    "volumeChauffe" double precision,
    "isPartiesCom" boolean,
    "IdTypeMission" character varying(50),
    "isImpossibleMesure" boolean,
    "justifImpossibleMesure" character varying(500),
    ordre integer,
    "idIFTZone" uuid,
    "surfRT" double precision,
    "volumeInterieur" double precision
);


ALTER TABLE public."(ADN_DIAG) IFTMGRel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMesure; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMesure" (
    "idIFTMesure" integer NOT NULL,
    "idIFTEssai" integer,
    numero integer,
    "isPressurisation" boolean NOT NULL,
    pression double precision,
    "pressionDemande" double precision,
    "debitMesure" double precision,
    "debitVenv" double precision,
    "AnneauMesure" character varying(10),
    "debitReleve" double precision,
    "erreurApp" double precision,
    "pressionVentilateur" double precision,
    "idIFTAppMesure" integer,
    "idIFTAppVentilo" integer,
    "vitesseVentilo" integer,
    "deltaHomogeneitePression" double precision
);


ALTER TABLE public."(ADN_DIAG) IFTMesure" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMesureAnx; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMesureAnx" (
    "idIFTMesureAnx" integer NOT NULL,
    "idIFTMesure" integer,
    "idIFTApp" integer,
    "typeMesure" character varying(10),
    "pressionDemande" double precision,
    numero integer,
    valeur double precision,
    commentaire character varying(500)
);


ALTER TABLE public."(ADN_DIAG) IFTMesureAnx" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMesureApp; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMesureApp" (
    "idIFTMesureApp" integer NOT NULL,
    "idIFTEssai" integer NOT NULL,
    "idIFTAppMesure" integer NOT NULL,
    "idIFTAppVentilo" integer NOT NULL,
    numero integer,
    "isPressurisation" boolean NOT NULL,
    pression double precision,
    "pressionDemande" double precision,
    "debitMesure" double precision,
    "debitVenv" double precision,
    "AnneauMesure" character varying(10),
    "debitReleve" double precision,
    "erreurApp" double precision,
    "pressionVentilateur" double precision,
    "vitesseVentilo" integer,
    "typeMesure" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) IFTMesureApp" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTMesureDP0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTMesureDP0" (
    "idIFTMesureDP0" integer NOT NULL,
    "idIFTEssai" integer,
    "isInitial" boolean NOT NULL,
    valeur double precision
);


ALTER TABLE public."(ADN_DIAG) IFTMesureDP0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTOuverture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTOuverture" (
    "idIFTOuverture" integer NOT NULL,
    "idMission" integer,
    type integer,
    libelle character varying(255),
    etat integer,
    justification text,
    "isUserModif" boolean NOT NULL,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "commentairePhoto" text,
    disc character varying(5),
    "etatES" character varying(50),
    "idIFTZone" uuid
);


ALTER TABLE public."(ADN_DIAG) IFTOuverture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParam" (
    "idParam" integer NOT NULL,
    "nbDecimal" integer,
    "isGenererAnx" boolean NOT NULL,
    "isGenererPhoto" boolean NOT NULL,
    "isGenererFuiteLocal" boolean NOT NULL,
    "isGenererCalculSurf" boolean NOT NULL,
    "isFuiteSansLocal" boolean NOT NULL,
    "croquisBuilderPastilleFuite" text,
    "nbMesureAuto" integer,
    "IntervalMesAuto" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isTempActif" boolean NOT NULL,
    "isVentActif" boolean NOT NULL,
    "isDeltaActif" boolean NOT NULL,
    "isMesureActif" boolean NOT NULL,
    "isMesureMaxActif" boolean NOT NULL,
    "isMesureMinActif" boolean NOT NULL,
    "isV4Actif" boolean NOT NULL,
    "minMesureValid" double precision,
    "maxMesureInterval" double precision,
    "DeltaPriseMesure" double precision,
    "isGenererCertificatCompetence" boolean NOT NULL,
    "isGenererAssurance" boolean NOT NULL,
    "dureePalierSec" double precision,
    "deltaMesureMin" double precision,
    "idNorme" integer,
    "isExposantActif" boolean,
    "isCoeffDeterminationActif" boolean,
    "isMesureMax25PaActif" boolean,
    "isHomogeneiteActif" boolean,
    "isGenererCertificatEtalon" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) IFTParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamCoefEtalonnage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamCoefEtalonnage" (
    "idCoefEtalonnage" integer NOT NULL,
    "idEtalonnage" integer,
    "modeleFan" character varying(25),
    "isDefaut" boolean,
    "typeCoef" character varying(50) NOT NULL,
    "idRange" character varying(25),
    intitule character varying(150),
    valeur double precision,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTParamCoefEtalonnage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamColonnesXls; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamColonnesXls" (
    "idParam" integer NOT NULL,
    "idCol" integer NOT NULL,
    "LibelleCol" character varying(100),
    "idxCol" character varying(3) NOT NULL,
    "typeData" character varying(50),
    "formatString" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTParamColonnesXls" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamEtalonnage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamEtalonnage" (
    "idEtalonnage" integer NOT NULL,
    "idEnumIFTAppareil" integer,
    titre character varying(100),
    numero character varying(100),
    organisme character varying(255),
    "idInterlocuteur" integer,
    "dateEtalonnage" timestamp without time zone,
    "dureeValiditeMois" integer,
    ordre integer,
    "dateFin" timestamp without time zone,
    commentaire text,
    "idResCertif" uuid,
    "previewDataCertif" bytea,
    "titreCertif" character varying(255),
    "idResConstatVerification" uuid,
    "previewDataConstatVerification" bytea,
    "titreConstatVerification" character varying(255),
    "plageEtalonnage" character varying(255),
    "programmeEtalonnageMin" text,
    "erreurMaxTolere" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "uniteCoef" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) IFTParamEtalonnage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamFichierXls; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamFichierXls" (
    "idParam" integer NOT NULL,
    "NomFeuille" character varying(31),
    "idxRowStartData" integer,
    "idxRowEndData" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTParamFichierXls" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamImg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamImg" (
    "idIFTParamImg" integer NOT NULL,
    "typeUsage" character varying(50),
    "seuilLibelle" character varying(50),
    "seuilValeur" double precision,
    "seuilColorStart" integer,
    "seuilColorEnd" integer,
    "isAfficherAutreLabel" boolean NOT NULL,
    "isAfficherLegende" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idIFTLabel" integer
);


ALTER TABLE public."(ADN_DIAG) IFTParamImg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamLigneProtocole; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamLigneProtocole" (
    "idLigneProtocole" integer NOT NULL,
    "idParamProtocole" integer,
    ordre integer,
    intitule text,
    "typeValeur" character varying(10),
    "valeurNum" real,
    "valeurTxt" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTParamLigneProtocole" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTParamProtocoleControle; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTParamProtocoleControle" (
    "idParamProtocole" integer NOT NULL,
    titre character varying(500),
    ordre integer NOT NULL,
    "dateFin" timestamp without time zone,
    "isDefaut" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTParamProtocoleControle" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTPhotoFuite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTPhotoFuite" (
    "idIFTPhotoFuite" integer NOT NULL,
    "idIFTFuite" integer,
    ordre integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) IFTPhotoFuite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTPhotoOuverture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTPhotoOuverture" (
    "idIFTPhotoOuverture" integer NOT NULL,
    "idIFTOuverture" integer,
    ordre integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) IFTPhotoOuverture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTPhotoProtocole; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTPhotoProtocole" (
    "idPhotoProtocole" integer NOT NULL,
    "idProtocole" integer,
    ordre integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) IFTPhotoProtocole" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTProtocoleControle; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTProtocoleControle" (
    "idProtocole" integer NOT NULL,
    "idMission" integer,
    "idIFTZone" uuid,
    "idIFTEssai" integer,
    "idControle" integer,
    titre character varying(500),
    ordre integer NOT NULL,
    "dateControle" timestamp without time zone,
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) IFTProtocoleControle" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTRelLabel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTRelLabel" (
    "idIFTLabel" integer NOT NULL,
    "idIFTLabelRel" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) IFTRelLabel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTRelOuvLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTRelOuvLocal" (
    "idIFTRelOuvLocal" integer NOT NULL,
    "idIFTOuverture" integer NOT NULL,
    "idIFTLocal" integer NOT NULL,
    etat integer,
    justification text,
    "idResPhoto1" uuid,
    "previewDataPhoto1" bytea,
    "titrePhoto1" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) IFTRelOuvLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTSurface; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTSurface" (
    "idIFTSurface" integer NOT NULL,
    "idMission" integer,
    libelle character varying(50),
    "Type" integer,
    "donneSur" integer,
    largeur double precision,
    hauteur double precision,
    surface double precision,
    volume double precision,
    "hasVoletRoulant" boolean NOT NULL,
    "idIFTZone" uuid
);


ALTER TABLE public."(ADN_DIAG) IFTSurface" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) IFTZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) IFTZone" (
    "idIFTZone" uuid NOT NULL,
    "idMission" integer,
    "idTypeMissionZone" character varying(50),
    "typeBatiment" character varying(50),
    "typeUsage" character varying(50),
    "isBBC" boolean NOT NULL,
    intitule character varying(500),
    descriptif character varying(500),
    "numeroLot" character varying(50),
    "modeConstructif" character varying(255),
    "materiauxBat" character varying(255),
    "isolationBat" character varying(255),
    "ventilSystem" character varying(255),
    "ventilMoteur" character varying(255),
    "sysAireSpecifique" text,
    chauffage character varying(255),
    refroidissement character varying(255),
    "aireNet" double precision,
    "surfDep" double precision,
    "isSyntheseET" boolean NOT NULL,
    "incertSurfDep" double precision,
    "justifSurfDep" text,
    hauteur double precision,
    volume double precision,
    "isSyntheseETVolume" boolean NOT NULL,
    "incertVolume" double precision,
    "justifVolume" text,
    "isImpossibleMesure" boolean,
    "justifImpossibleMesure" character varying(500),
    ordre integer,
    "infoPrisePressionExt" character varying(500),
    "nbNiveauxZone" double precision,
    "niveauMin" real,
    "niveauMax" real,
    "justifNombreFan" text,
    "idResJustifNombreFan" uuid,
    "previewDataJustifNombreFan" bytea,
    "titreJustifNombreFan" character varying(255),
    "surfRT" double precision,
    "volumeInterieur" double precision
);


ALTER TABLE public."(ADN_DIAG) IFTZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) InsertElementItem; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) InsertElementItem" (
    "idItemModele" integer NOT NULL,
    "idModele" integer NOT NULL,
    "idCategorieElement" character varying(10),
    "nomElement" character varying(100),
    zone character varying(50),
    substrat character varying(100),
    revetement character varying(100),
    "categorieAmiante" character varying(255),
    "typeCFA" character varying(2),
    "obsPlomb" character varying(255),
    "isSCAmiante" boolean NOT NULL,
    "isSCParasite" boolean NOT NULL,
    "isSCPlomb" boolean NOT NULL,
    "idElementParent" integer,
    "SousElement" character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "listeAmiante" character varying(5),
    "typeGEAmiante" character varying(2),
    "customFieldAmiante1" character varying(255),
    "customFieldPlomb1" character varying(255),
    "customFieldTermite1" character varying(255),
    "customFieldMateriauAmiante" character varying(255),
    "customFieldMateriauPlomb" character varying(255),
    "customFieldMateriauTermite" character varying(255),
    ordre integer,
    "codePCA360" character varying(500)
);


ALTER TABLE public."(ADN_DIAG) InsertElementItem" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) InsertElementModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) InsertElementModele" (
    "idModele" integer NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "isBati" boolean NOT NULL,
    "categorieBien" character varying(5),
    "idContrat" integer
);


ALTER TABLE public."(ADN_DIAG) InsertElementModele" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Mission; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Mission" (
    "idMission" integer NOT NULL,
    "idDossier" integer NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    intitule character varying(255),
    "titreRapport" character varying(255),
    "conditionReperage" text,
    note text,
    "dureeValiditeMois" integer,
    "idEmploye" integer,
    "idIntervenant" integer,
    "idRdv" integer,
    "dateRdv" timestamp without time zone,
    "dateFinRdv" timestamp without time zone,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    commentaire text,
    "contactPlace" character varying(100),
    accompagnateur character varying(100),
    conclusion text,
    "isFini" boolean NOT NULL,
    statut integer,
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "IdUserCre" integer,
    "idUserMaj" integer,
    "idUserSup" integer,
    "idLoi" integer,
    "moyenDisposition" text,
    "documentsRemis" text,
    "dureeExpertise" character varying(100),
    "idResMemoVocal" uuid,
    "dateRedaction" timestamp without time zone,
    "dateValidite" timestamp without time zone,
    resultat integer,
    "IsSync" boolean,
    "ChangeTime" timestamp without time zone,
    "LastSyncTime" timestamp without time zone,
    "idNorme" integer,
    "DateLastRNdata" timestamp without time zone,
    "DateLastESdata" timestamp without time zone,
    "montantHT" numeric(18,2),
    "montantTTC" numeric(18,2),
    "tauxTVA" numeric(18,2) NOT NULL,
    "refExterne" character varying(255),
    "isPreRapport" boolean NOT NULL,
    "dateLastControl" timestamp without time zone,
    "resultatControl" integer NOT NULL,
    "idTypeRapport" integer,
    "isAPO" boolean NOT NULL,
    "isAPOGeneration" boolean NOT NULL,
    "isUseAnnexeDynamique" boolean,
    "isUseCartouche" boolean,
    "formatMatriceCartouche" character varying(50),
    "isMention" boolean,
    "typeBatiment" character varying(500),
    "idModelePerso" uuid,
    "nbPrelevEstime" integer,
    "idCadreMission" character varying(50),
    "nbPageRapport" integer,
    "typeRapportExt" character varying(100),
    reserve text,
    "numRevision" integer NOT NULL,
    "idExterne" character varying(50),
    "typeRapport" character varying(100),
    "idUnique" uuid,
    "isVisible" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) Mission" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionAnalyseLabo; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionAnalyseLabo" (
    "idAnalyseLabo" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idLaboratoire" integer,
    "dateCreation" timestamp without time zone,
    "referenceLabo" character varying(255),
    "idResCommande" uuid,
    "previewDataCommande" bytea,
    "dateLastEnvoi" timestamp without time zone,
    "dateLastReception" timestamp without time zone,
    "numeroDevis" character varying(255),
    priorite integer NOT NULL,
    statut integer NOT NULL,
    "attributPerso1" character varying(10),
    "attributPerso2" character varying(10),
    "identifiantExterne" character varying(255),
    "codeClientExterne" character varying(255),
    "idResInputData" uuid,
    "previewInputData" bytea,
    "idResOutputData" uuid,
    "previewOutputData" bytea,
    "idEmployeCommande" integer,
    "idLaboratoireHAP" integer,
    "nFa" character varying(255),
    "tFa" character varying(255),
    cnpe character varying(255),
    "customField1" character varying(255),
    "customField2" character varying(255),
    "customField3" character varying(255),
    "numBdc" character varying(255),
    "referenceBT" character varying(255),
    "referenceQrCommande" character varying(255),
    "commCommande" text,
    "numeroBT" text,
    transporteur character varying(255),
    "hasResAmiante" boolean,
    "hasResHAP" boolean,
    "isComAmiante" boolean,
    "isComHAP" boolean,
    "askHCT" boolean,
    "refComHAP" character varying(255),
    custom1 boolean,
    custom2 integer,
    custom3 double precision,
    custom4 character varying(255),
    custom5 character varying(255),
    custom6 character varying(255)
);


ALTER TABLE public."(ADN_DIAG) MissionAnalyseLabo" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionDetailVisite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionDetailVisite" (
    "idMissionVisite" integer NOT NULL,
    "idMission" integer NOT NULL,
    "dateVisite" timestamp without time zone,
    "objetVisite" text
);


ALTER TABLE public."(ADN_DIAG) MissionDetailVisite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionDocAnnexe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionDocAnnexe" (
    "idDocAnnexe" integer NOT NULL,
    "idMission" integer NOT NULL,
    "familleDoc" character varying(5),
    ordre integer,
    titre character varying(255),
    commentaire text,
    "idResDocument" uuid,
    "previewDataDocument" bytea,
    "ChangeTime" timestamp without time zone,
    "nbrNonPagine" integer,
    "Version" integer,
    "Type" character varying(255),
    "Origine" character varying(255),
    descriminant character varying(50),
    reference character varying(255),
    "dateDocument" timestamp without time zone,
    "isRemis" boolean,
    objet character varying(255),
    "isDefault" boolean NOT NULL,
    "idMissionPdc" integer,
    localisation character varying(255),
    etage character varying(50),
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) MissionDocAnnexe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionDocSociete; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionDocSociete" (
    "idDocSociete" integer NOT NULL,
    "idMission" integer,
    "idDocument" integer,
    "idTypeDocument" integer,
    ordre integer,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) MissionDocSociete" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionExpert; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionExpert" (
    "idMissionExpert" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idIntervenant" integer NOT NULL,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "nomExpert" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) MissionExpert" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionExpertAmiante; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionExpertAmiante" (
    "idMissionExpertAmiante" integer NOT NULL,
    "idMissionExpert" integer NOT NULL,
    "caracteristiqueMateriau" character varying(50),
    liste character varying(5),
    "nbrPrelevement" integer,
    "nbrSondage" integer,
    "codeMO" character varying(50),
    "procedeTravail" text,
    duree double precision,
    mpc text,
    epi text,
    "autreRisque" text,
    "dateControleExposition" timestamp without time zone,
    "resultatControleExposition" character varying(50),
    "organismeControleExposition" character varying(50),
    "niveauAccidentel" integer,
    "niveauExposition" integer,
    "dureeAccidentel" double precision,
    "TauxPoussiere" double precision,
    "VLEP" double precision,
    "nbEvaluation" integer,
    nature character varying(50),
    "concentrationExposition" double precision,
    "niveauExpositionJour" integer,
    "concentrationExpositionJour" double precision,
    "modeCalculDuree" integer
);


ALTER TABLE public."(ADN_DIAG) MissionExpertAmiante" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionPdc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionPdc" (
    "idMissionPdc" integer NOT NULL,
    "idParent" integer,
    "idEnumMissionPdc" integer,
    "idMission" integer,
    "typeMissionPdc" character varying(10),
    "discMissionPdc" character varying(15),
    intitule character varying(500),
    "precision" character varying(500),
    ordre integer,
    statut integer,
    "isUserParam" boolean
);


ALTER TABLE public."(ADN_DIAG) MissionPdc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionPrelevement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionPrelevement" (
    "idPrelevement" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idLaboratoire" integer,
    reference character varying(50),
    "referenceExt" character varying(50),
    objet character varying(255),
    "infosDivers" character varying(255),
    "methodeAnalyse" character varying(255),
    resultat integer,
    commentaire text,
    "datePrelevement" timestamp without time zone,
    "dateEnvoi" timestamp without time zone,
    "DateRetour" timestamp without time zone,
    "ChangeTime" timestamp without time zone,
    "referenceUnique" character varying(50),
    "idAnalyseLabo" integer,
    "idResPrelevement" uuid,
    "previewDataPrelevement" bytea,
    priorite integer NOT NULL,
    "codeDemande" character varying(10),
    "idUnique" uuid,
    latitude numeric(18,15),
    longitude numeric(18,15),
    "askMulticoucheEsl" boolean,
    "lotEsl" character varying(10),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    taille double precision,
    "refrencePvAmiante" character varying(500),
    "refrencePvHAP" character varying(500),
    "isAmiante" boolean,
    "isHAP" boolean,
    "methodeAnalyseHAP" character varying(255),
    "resultatHAP" integer,
    "resultatNumeriqueHAP" double precision,
    "resultatTexteHAP" character varying(500),
    "normeAnalyseAmiante" character varying(100),
    "normeAnalyseHAP" character varying(100),
    suport character varying(255),
    "idRCBPrelev" uuid,
    "idLaboratoireHAP" integer,
    "idExterne" character varying(50),
    "referenceSachet" character varying(255),
    "listePhotosId" text,
    "ListeMPSCA" character varying(5),
    "hasResAmiante" boolean,
    "hasResHAP" boolean,
    "isComAmiante" boolean,
    "isComHAP" boolean,
    custom1 boolean,
    custom2 integer,
    custom3 double precision,
    custom4 character varying(255)
);


ALTER TABLE public."(ADN_DIAG) MissionPrelevement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionPrelevementCouche; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionPrelevementCouche" (
    "idCouche" integer NOT NULL,
    "idPrelevement" integer NOT NULL,
    intitule character varying(255),
    "codeExt" character varying(50),
    ordre integer NOT NULL,
    epaisseur double precision,
    "refrencePvAmiante" character varying(500),
    "refrencePvHAP" character varying(500),
    "ordreAnalyse" integer,
    liste character varying(50),
    chapitre character varying(255),
    composant character varying(255),
    "partieComposant" character varying(500),
    "toAnalyse" boolean,
    "attPerso1" character varying(50),
    "attPErso2" text,
    "attPerso3" boolean,
    "attPerso4" double precision
);


ALTER TABLE public."(ADN_DIAG) MissionPrelevementCouche" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) MissionPrelevementCoucheResultat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) MissionPrelevementCoucheResultat" (
    "idCoucheResultat" integer NOT NULL,
    "idCouche" integer NOT NULL,
    intitule character varying(1000),
    "methodeAnalyse" character varying(255),
    unite character varying(50),
    "codeTypeAnalyseExt" character varying(50),
    "codeTypeResultatExt" character varying(50),
    "codeResultatExt" character varying(50),
    "isPresenceAmiante" integer NOT NULL,
    "isConformeCofrac" boolean,
    "resultatNumerique" double precision,
    "typeResultat" character varying(5),
    custom1 boolean,
    custom2 integer,
    custom3 double precision,
    custom4 character varying(255)
);


ALTER TABLE public."(ADN_DIAG) MissionPrelevementCoucheResultat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSH; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSH" (
    "idMission" integer NOT NULL,
    "isShowCommentaire" boolean,
    "nbOccupants" integer,
    "isPretTauxZero" boolean,
    "isModeDetail" boolean,
    "isGenererAnnexe" boolean,
    "isGenererCom" boolean,
    "isGenereAcquereur" boolean,
    "isGenereAssurance" boolean,
    "isGenerePhoto" boolean,
    "IsGenererEtatImmeuble" boolean,
    "isShowDetailAnnexe" boolean,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) NSH" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHAnnexeTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHAnnexeTravaux" (
    "idAnnexeTravaux" integer NOT NULL,
    "idMission" integer,
    "surfaceHabitableObs" text,
    "habitabiliteObs" text,
    "modeChauffageObs" text,
    "etatDesSolsObs" text,
    "normesEDFGDFObs" text,
    "etatImmeubleObs" text,
    "conclusionsObs" text,
    "etancheiteObs" text,
    "partieCommuneObs" text,
    "canalisationObs" text,
    "normeDimensionnelleObs" text,
    "ouvertureVentilationObs" text,
    "cuisineObs" text,
    "equipementSanitaireObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHAnnexeTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHAnomalieElec; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHAnomalieElec" (
    "idAnomalieElec" integer NOT NULL,
    "idMission" integer,
    "numeroFiche" character varying(16),
    "numeroControl" character varying(32),
    "libelleAnomalie" text,
    recommandation text,
    local text
);


ALTER TABLE public."(ADN_DIAG) NSHAnomalieElec" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHAnomalieGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHAnomalieGaz" (
    "idAnomalieGaz" integer NOT NULL,
    "idMission" integer,
    "numeroControl" character varying(8),
    "libelleAnomalie" text,
    recommandation text,
    "typeAnomalie" character varying(50),
    local text
);


ALTER TABLE public."(ADN_DIAG) NSHAnomalieGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHConclusion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHConclusion" (
    "idConclusion" integer NOT NULL,
    "idMission" integer,
    "isNormeSurface" character varying(20),
    "normeSurfaceObs" text,
    "isNormeHabitabilite" character varying(20),
    "NormeHabitabiliteObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHConclusion" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatCanalisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatCanalisation" (
    "NSHEtaCanalisation" integer NOT NULL,
    "idMission" integer,
    "isEvitePollution" character varying(20),
    "evitePollutionObs" text,
    "isDebitSuffisant" character varying(20),
    "debitSuffisantObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatCanalisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatChauffage" (
    "idEtatChauffage" integer NOT NULL,
    "idMission" integer,
    "isChauffageEau" character varying(20),
    "chauffageEauObs" text,
    "isChauffageElectrique" character varying(20),
    "chauffageElectriqueObs" text,
    "isChauffageThermodynamique" character varying(20),
    "chauffageThermodynamiqueObs" text,
    "isChauffageBois" character varying(20),
    "chauffageBoisObs" text,
    "isChauffageIndividuelDispositifRegulation" character varying(20),
    "isChauffageIndividuelCalorifugeage" character varying(20),
    "isChauffageIndividuelEquilibrage" character varying(20),
    "isEquipeEmetteurFixe" character varying(20),
    "isEquipePlancherChauffant" character varying(20),
    "isEquipePlafondRayonnant" character varying(20),
    "isEquipeSystemeAccumulation" character varying(20),
    "isPossedePoele" character varying(20),
    "isPossedeFoyerFerme" character varying(20),
    "isPossedeInsert" character varying(20),
    "isPossedeChaudiere" character varying(20),
    "modeChauffage" character varying(50),
    "modeChauffageObs" text,
    "isNombreChauffage" character varying(20)
);


ALTER TABLE public."(ADN_DIAG) NSHEtatChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatCuisine; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatCuisine" (
    "idEtatCuisine" integer NOT NULL,
    "idMission" integer,
    "isEvier" character varying(20),
    "evierObs" text,
    "isSiphon" character varying(20),
    "siphonObs" text,
    "isChuteEauUsee" character varying(20),
    "isEauPotable" character varying(20),
    "eauPotableObs" text,
    "isEauFroide" character varying(20),
    "eauFroideObs" text,
    "isEauChaude" character varying(20),
    "eauChaudeObs" text,
    "eauObs" text,
    "isAppareilCuisson" character varying(20),
    "isConduitEvacuation" character varying(20),
    "systemeAerationObs" text,
    "cuisineOuCoinCuisine" character varying(50),
    "isFenetre" character varying(20),
    "fenetreObs" text,
    "isAutreAeration" character varying(20),
    "autreAerationObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatCuisine" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatEDFGDF; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatEDFGDF" (
    "idEtatEDFGDF" integer NOT NULL,
    "idMission" integer,
    "isEDF" character varying(20),
    "EDFObs" text,
    "isGDF" character varying(20),
    "GDFObservation" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatEDFGDF" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatEtancheite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatEtancheite" (
    "idEtatEtancheite" integer NOT NULL,
    "idMission" integer,
    "isProtegeContreRuissellement" character varying(20),
    "isProtegeContreInfiltration" character varying(20),
    "isProtegeContreRemonte" character varying(20),
    obs text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatEtancheite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatImmeuble" (
    "idEtatImmeuble" integer NOT NULL,
    "idMission" integer,
    "etatInterieur" character varying(20),
    "etatInterieurObs" text,
    "isProjetRefectionInterieur" character varying(20),
    "projetRefectionInterieurObs" text,
    "etatFacadeRue" character varying(20),
    "etatFacadeRueObs" text,
    "isProjetRavalementFacadeRue" character varying(20),
    "projetRavalementFacadeRueObs" text,
    "etatFacadeCour" character varying(20),
    "etatFacadeCourObs" text,
    "isProjetRavalementFacadeCour" character varying(20),
    "projetRavalementFacadeCourObs" text,
    "etatCouverture" character varying(20),
    "etatCouvertureObs" text,
    "isProjetRefectionCouverture" character varying(20),
    "projetRefectionCouvertureObs" text,
    "etatExterieurObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatOuvertureVentillation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatOuvertureVentillation" (
    "idEtatOuvertureVentillation" integer NOT NULL,
    "idMission" integer,
    "isOuverture" character varying(20),
    "isVentilation" character varying(20),
    "ouvertureVentilationObs" text,
    "isSystemeEvacuation" character varying(20),
    "systemeEvacuationObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatOuvertureVentillation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatPartieCommune; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatPartieCommune" (
    "idEtatPartieCommune" integer NOT NULL,
    "idMission" integer,
    "isGrosOeuvre" character varying(20),
    "grosOeuvreObs" text,
    "isMenuiserieEtanche" character varying(20),
    "menuiserieEtancheObs" text,
    "isCombleDegage" character varying(20),
    "combleDegageObs" text,
    "isCouvertureEtanche" character varying(20),
    "couvertureEtancheObs" text,
    "isSoucheCheminee" character varying(20),
    "soucheChemineeObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatPartieCommune" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatSdb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatSdb" (
    "idEtatSdb" integer NOT NULL,
    "idMission" integer,
    "isLavabo" character varying(20),
    "lavaboObs" text,
    "isBaignoire" character varying(20),
    "baignoireObs" text,
    "isDouche" character varying(20),
    "doucheObs" text,
    "isFenetre" character varying(20),
    "fenetreObs" text,
    "isAutreAeration" character varying(20),
    "autreAerationObs" text,
    "isSdbSeule" boolean,
    "sdbObs" text,
    "isEauPotable" character varying(20),
    "isEauFroide" character varying(20),
    "isEauChaude" character varying(20),
    "eauObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatSdb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatSol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatSol" (
    "idEtatSol" integer NOT NULL,
    "idMission" integer,
    "isEtancheite" character varying(20),
    "etancheiteObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatSol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHEtatWC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHEtatWC" (
    "idEtatWC" integer NOT NULL,
    "idMission" integer,
    "isSepare" character varying(20),
    "separeObs" text,
    "isSalleBain" character varying(20),
    "salleBainObs" text,
    "isExterieurLogement" character varying(20),
    "exterieurLogementObs" text,
    "isFenetre" character varying(20),
    "fenetreObs" text,
    "isAutreAeration" character varying(20),
    "autreAerationObs" text,
    "isSepareeCuisine" character varying(20),
    "isCuvetteAnglaise" character varying(20),
    "isChasseEau" character varying(20),
    "isSimpleEffetEau" character varying(20),
    "wcObs" text
);


ALTER TABLE public."(ADN_DIAG) NSHEtatWC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHLocal" (
    "idNSHLocal" integer NOT NULL,
    "idMission" integer,
    "idDossierLocal" uuid,
    "idEtatSdb" integer,
    "idEtatWC" integer,
    ordre integer,
    numero character varying(50),
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    justification text,
    nombre integer,
    carrez real,
    "horsCarrez" real,
    "libelleCategorie" character varying(50),
    hsp real,
    volume real,
    "idResMemoVocal" uuid,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) NSHLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) NSHParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) NSHParam" (
    "idNSHParam" integer NOT NULL,
    "isShowDetailAnnexe" boolean,
    "isShowCommentaire" boolean,
    "DefaultResult" character varying(20),
    "DefaultObs" text,
    "isGenererAnnexe" boolean,
    "isGenererCom" boolean,
    "isGenererAcquereur" boolean,
    "isGenererAssurance" boolean,
    "isGenererPhoto" boolean,
    "isGenererEtatImmeuble" boolean,
    "croquisBuilderPastilleLocal" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) NSHParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Norme; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Norme" (
    "idNorme" integer NOT NULL,
    intitule character varying(255),
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50),
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) Norme" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRA; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRA" (
    "idMission" integer NOT NULL,
    "anneeConstruction" integer,
    "typeCopropriete" character varying(255),
    "orientationFacade" character varying(255),
    "conditionMeteorologique" character varying(255),
    temperature integer,
    "IsPropPresent" boolean,
    "IsClientPresent" boolean,
    "isDOPresent" boolean,
    "titreDocument" character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) PRA" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRACategorie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRACategorie" (
    "idCategorie" integer NOT NULL,
    "idMission" integer,
    "IntituleCategorie" character varying(255),
    "Ordre" integer,
    "IdCatConst" integer,
    "IparamCategorie" character varying(255),
    "isGenerique" boolean,
    "texteDefaut" text,
    "libIco" character varying(255),
    "idResIco" uuid
);


ALTER TABLE public."(ADN_DIAG) PRACategorie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRACategorieConst; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRACategorieConst" (
    "idCatConst" integer NOT NULL,
    "IntituleCatConst" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) PRACategorieConst" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRAChapitreDeclaProprio; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRAChapitreDeclaProprio" (
    "idChapitre" integer NOT NULL,
    "idDeclaProprio" integer,
    intitule character varying(255),
    ordre smallint
);


ALTER TABLE public."(ADN_DIAG) PRAChapitreDeclaProprio" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRACommConstats; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRACommConstats" (
    "idCommConstat" integer NOT NULL,
    "idCategorie" integer,
    "idElement" integer,
    "idSousElement" integer,
    titre character varying(255),
    texte text,
    discriminant integer NOT NULL,
    gravite character varying(255),
    ordre integer,
    "idMission" integer,
    "idCatParent" integer,
    "idElemParent" integer,
    type character varying(255),
    "IntituleCategorie" character varying(50),
    "IntituleElement" character varying(50),
    "IntituleSousElement" character varying(50),
    "idCategType" integer,
    "idElemType" integer,
    "idSsElemType" integer,
    hierarchie smallint
);


ALTER TABLE public."(ADN_DIAG) PRACommConstats" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRACommIPrincipale; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRACommIPrincipale" (
    "idCommIPrincip" integer NOT NULL,
    "idMission" integer,
    "titreCommentaire" character varying(255),
    "texteCommentaire" text,
    discriminant integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) PRACommIPrincipale" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRADeclaProprio; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRADeclaProprio" (
    "idDeclaProprio" integer NOT NULL,
    "idMission" integer,
    "isPapier" boolean,
    "isRapport" boolean,
    "isIndependant" boolean,
    "isInspecteur" boolean,
    "isAcquereur" boolean,
    "isAgent" boolean,
    "Autre" character varying(255),
    "lieuDecla" character varying(255),
    "dateDecla" timestamp without time zone,
    "nomExpert" character varying(255),
    "idExpert" integer,
    "InfoFournies" character varying(255),
    "idResSignature" uuid,
    "previewDataSignature" bytea
);


ALTER TABLE public."(ADN_DIAG) PRADeclaProprio" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRAElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRAElement" (
    "idElement" integer NOT NULL,
    "idCategorie" integer,
    "intituleElement" character varying(255),
    ordre integer,
    "IntituleCategorie" character varying(50),
    "IparamElement" character varying(255),
    "isGenerique" boolean
);


ALTER TABLE public."(ADN_DIAG) PRAElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRANote; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRANote" (
    "idNote" integer NOT NULL,
    "idSousElement" integer,
    "V" boolean,
    "PV" boolean,
    "NV" boolean,
    "NA" boolean,
    "idSsElemType" integer
);


ALTER TABLE public."(ADN_DIAG) PRANote" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRANoteElem; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRANoteElem" (
    "IdNoteElem" integer NOT NULL,
    "IdElement" integer,
    "V" boolean,
    "PV" boolean,
    "NV" boolean,
    "NA" boolean,
    "idElemType" integer
);


ALTER TABLE public."(ADN_DIAG) PRANoteElem" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRAPJCommConstats; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRAPJCommConstats" (
    "idPieceJointe" integer NOT NULL,
    titre character varying(255),
    legende character varying(255),
    "idCommConstat" integer,
    "Position" smallint,
    "Lsize" real,
    "Wsize" real,
    ordre integer,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) PRAPJCommConstats" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRAParamGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRAParamGeneral" (
    "idGeneration" integer NOT NULL,
    "cheminGeneration" character varying(50),
    "isTotal" boolean,
    "titreDocument" character varying(255),
    "isConclusion" boolean,
    "isModeIcone" boolean,
    "Position" smallint,
    "Lsize" real,
    "Wsize" real,
    "isVentilationInfo" boolean,
    "ImageDir" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) PRAParamGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRAQuestionDeclaProprio; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRAQuestionDeclaProprio" (
    "idQuesion" integer NOT NULL,
    "idChapitre" integer,
    question text,
    "Isoui" boolean,
    "Isnon" boolean,
    "Isjnp" boolean,
    reponse text,
    ordre smallint
);


ALTER TABLE public."(ADN_DIAG) PRAQuestionDeclaProprio" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PRASousElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PRASousElement" (
    "idSousElement" integer NOT NULL,
    "idElement" integer,
    "intituleSousElement" character varying(255),
    ordre integer,
    "IntituleElement" character varying(50),
    "IparamSsElement" character varying(255),
    "isGenerique" boolean
);


ALTER TABLE public."(ADN_DIAG) PRASousElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamCroquisBuilder; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamCroquisBuilder" (
    "IdParam" integer NOT NULL,
    "discParam" character varying(50),
    "idCategorieMission" character varying(50),
    "idCategorieMissionCB" character varying(50),
    intitule character varying(255),
    valeur character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ParamCroquisBuilder" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamDureeIntervention; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamDureeIntervention" (
    "idParamDureeIntervention" integer NOT NULL,
    "idCategorieMission" character varying(50),
    "idTypeMission" character varying(50),
    "nbPieceMin" integer NOT NULL,
    "nbPieceMax" integer NOT NULL,
    "dureeInterventionMinute" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) ParamDureeIntervention" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamGeneric; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamGeneric" (
    "idParametre" integer NOT NULL,
    zone character varying(50),
    intitule character varying(255),
    valeur character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ParamGeneric" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamLog; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamLog" (
    "tableName" character varying(100) NOT NULL,
    date timestamp without time zone,
    "SentAnchor" bytea,
    "ReceivedAnchor" bytea
);


ALTER TABLE public."(ADN_DIAG) ParamLog" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamPublication; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamPublication" (
    "idParamPublication" integer NOT NULL,
    "titreModeleCreCompte" character varying(255),
    "texteModeleCreCompte" text,
    "titreModelePublication" character varying(255),
    "texteModelePublication" text,
    "isPreviewMail" boolean,
    "isSignerDocs" boolean,
    "isExpertSignataire" boolean,
    "defaultTemplate" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ParamPublication" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamReporting; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamReporting" (
    "idParamReporting" integer NOT NULL,
    "isGenPageGarde" boolean,
    "isGenNoteSynthese" boolean,
    "isGenSyntheseAttestation" boolean,
    "isGenAutresDocuments" boolean,
    "isFileNameIncrementation" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ParamReporting" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamSync; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamSync" (
    "MargeDaySync" integer,
    "VersionServeur" character varying(10),
    "MissionStatutSyncS" integer,
    "MissionStatutSyncL" integer,
    "LastSyncFromLoc" timestamp without time zone,
    "LastSyncFromServ" timestamp without time zone,
    "idParamSync" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) ParamSync" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) ParamTombstone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) ParamTombstone" (
    "tableName" character varying(255),
    "rowId" character varying(50),
    "rowId2" character varying(50),
    "rowId3" character varying(50),
    "DeleteTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) ParamTombstone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Plomb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Plomb" (
    "idMission" integer NOT NULL,
    "idPlombParamHisto" integer,
    "idPlombAppareilHisto" integer,
    "codeConclusion" character varying(50),
    "idLaboratoire" integer,
    enfants boolean,
    "ageEnfants" character varying(100),
    "nombreEnfants" integer,
    "nombreEnfantsMoins6Ans" integer,
    "numPremiereMesure" integer,
    "nbrBatiment" character varying(100),
    "nbrCageEscalier" character varying(100),
    "nbrNiveaux" character varying(100),
    "isPrelevementLabo" boolean,
    occupe boolean,
    "isModeNorme" boolean,
    "margeErreur" real,
    "isGenererCertificat" boolean,
    "isGenererAnnexe" boolean,
    "idResMemoVocal" uuid,
    "ChangeTime" timestamp without time zone,
    "isGenAnnexeMesuresPos" boolean NOT NULL,
    "fabriquantEtalon" character varying(255),
    "numeroNISTEtalon" character varying(255),
    "concentrationEtalon" real,
    "incertitudeEtalon" real,
    "isMode2011" boolean,
    "isMode2006" boolean,
    "isConcerneCanal" boolean NOT NULL,
    "perimetreMission" text,
    "conditionsVisite" text,
    "natureTravaux" text,
    "isUseTravauxBien" boolean NOT NULL,
    "isAfficheEtatConservationUD" boolean NOT NULL,
    "isAfficheObservationUD" boolean NOT NULL,
    "isAfficheTravauxUD" boolean NOT NULL,
    "seuilPos" real,
    "seuilPosPrelev" real,
    "isGenererAnnexeCB" boolean,
    "isGenererPR" boolean
);


ALTER TABLE public."(ADN_DIAG) Plomb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombAppareil" (
    "idAppareil" integer NOT NULL,
    marque character varying(255),
    nom character varying(255),
    "numeroSerie" character varying(255),
    "typeDocument" character varying(100),
    "nomFeuille" character varying(255),
    "ligneDepart" integer,
    "colEtal1" character varying(3),
    "valEtal1" character varying(50),
    "colEtal2" character varying(3),
    "valEtal2" character varying(50),
    "colEtal3" character varying(3),
    "valEtal3" character varying(50),
    "colNumMesure" character varying(3),
    "colPiece" character varying(3),
    "colEtage" character varying(3),
    "colZone" character varying(3),
    "colUniteDiag" character varying(3),
    "colSousElement" character varying(3),
    "colSubstrat" character varying(3),
    "colRevetement" character varying(3),
    "colLocalisation" character varying(3),
    "colNatureDeg" character varying(3),
    "colTeneur" character varying(3),
    "colMargeErreur" character varying(3),
    "colFacteurDeg" character varying(3),
    "colObservation" character varying(3),
    "portCom" character varying(6),
    "colEvaluationSurface" character varying(3),
    "colDatePrise" character varying(3),
    "colPrecoTravaux" character varying(3),
    "idEmployeDefaut" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "dateSuppr" timestamp without time zone,
    "fabriquantEtalon" character varying(255),
    "numeroNISTEtalon" character varying(255),
    "concentrationEtalon" real,
    "incertitudeEtalon" real,
    description character varying(255),
    "colDegradation" character varying(3),
    "dureeSource" integer,
    "idSiteGestion" character varying(50),
    "idSociete" character varying(50) NOT NULL
);


ALTER TABLE public."(ADN_DIAG) PlombAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombAppareilHisto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombAppareilHisto" (
    "idPlombAppareilHisto" integer NOT NULL,
    "idAppareil" integer,
    "dateChangementSource" timestamp without time zone,
    "natureRadionucleide" character varying(255),
    "activiteSource" character varying(255),
    commentaire character varying(255),
    "dateFin" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) PlombAppareilHisto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombConclusionAuto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombConclusionAuto" (
    "codeConclusion" character varying(50) NOT NULL,
    "idCategorieMission" character varying(50),
    conclusion text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) PlombConclusionAuto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombLocal" (
    "idPlombLocal" integer NOT NULL,
    "idDossierLocal" uuid,
    "idMission" integer,
    ordre integer,
    numero character varying(50),
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    justification text,
    "isEffondrement" boolean,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "longueurVisibleCanal" double precision,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50),
    "moyenAccesNV" text,
    "codeExterne" character varying(100),
    commentaire text
);


ALTER TABLE public."(ADN_DIAG) PlombLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombMesure; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombMesure" (
    "idMesure" integer NOT NULL,
    "idPlombUniteDiag" integer,
    "idMission" integer,
    "numMesure" integer,
    teneur real,
    marge real,
    localisation character varying(100),
    "datePrise" timestamp without time zone,
    observation text,
    "etatDegradation" character varying(100),
    "evalSurface" integer,
    "precoTravaux" boolean,
    "natureDegradation" character varying(100),
    "typeMesure" character varying(10),
    "idPrelevement" integer
);


ALTER TABLE public."(ADN_DIAG) PlombMesure" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombParam" (
    "idCategorieMission" character varying(50) NOT NULL,
    "idLaboratoire" integer,
    "isModeNormeDefaut" boolean,
    "idAppareil" integer,
    "margeErreur" real,
    "numPremiereMesureDef" integer,
    "teneurDefaut" real,
    "etatDegDefaut" character varying(100),
    "localisationM1" character varying(100),
    "localisationM2" character varying(100),
    "localisationM3" character varying(100),
    "isInsertDoublon" boolean,
    "InsertDefautMode" integer,
    "isUseMargeErreur" boolean,
    "croquisBuilderPastilleMesure" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isGenAnnexeMesuresPos" boolean NOT NULL,
    "isTeneurDefautAleatoire" boolean NOT NULL,
    "isTeneurTestAleatoire" boolean NOT NULL,
    "nbMesureTest" integer,
    "seuilTeneurInf" real,
    "seuilTeneurSup" real,
    "isEtalonDebutTest" boolean NOT NULL,
    "isEtalonFinTest" boolean NOT NULL,
    "valeurEtalonDebutTest" real,
    "valeurEtalonFinTest" real,
    "isMode2011defaut" boolean,
    "isMode2006Defaut" boolean,
    "isAnnexeMesuresPos" boolean NOT NULL,
    "isAfficheEtatConservationUD" boolean,
    "isAfficheObservationUD" boolean,
    "isAfficheTravauxUD" boolean,
    "teneurDefautDiagPlomb" real,
    "seuilTeneurInfDiagPlomb" real,
    "seuilTeneurSupDiagPlomb" real,
    "isTeneurDefautAleatoireDiagPlomb" boolean NOT NULL,
    "isTeneurTestAleatoireDiagPlomb" boolean NOT NULL,
    "nbMesureTestDiagPlomb" integer,
    "isEtalonDebutTestDiagPlomb" boolean NOT NULL,
    "isEtalonFinTestDiagPlomb" boolean NOT NULL,
    "valeurEtalonDebutTestDiagPlomb" real,
    "valeurEtalonFinTestDiagPlomb" real,
    "isGenInfoPrelevCREP" boolean NOT NULL,
    "isGenInfoPrelevDiagPlomb" boolean NOT NULL,
    "modeUseCartouche" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) PlombParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombParamHisto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombParamHisto" (
    "idPlombParamHisto" integer NOT NULL,
    "idCategorieMission" character varying(50),
    "numeroASN" character varying(255),
    "dateAuthASN" timestamp without time zone,
    "dateFinASN" timestamp without time zone,
    "titulaireAuthASN" character varying(255),
    "responsableRadioProtec" character varying(255),
    "fabriquantEtalon" character varying(255),
    "numeroNISTEtalon" character varying(255),
    "concentrationEtalon" real,
    "incertitudeEtalon" real,
    "dateFin" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) PlombParamHisto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) PlombUniteDiag; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) PlombUniteDiag" (
    "idPlombUniteDiag" integer NOT NULL,
    "idPlombLocal" integer,
    "lienDossierElement" text,
    "idCategorieElement" character varying(10),
    ordre integer,
    "uniteMesure" character varying(100),
    "sousElement" character varying(100),
    revetement character varying(100),
    substrat character varying(100),
    zone text,
    classement integer,
    couleur character varying(50),
    "couleurHexa" character varying(6),
    "idPrelevement" integer,
    "isCoulureF4" boolean,
    "isMoisissureF5" boolean,
    observation text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "natureTravaux" character varying(500),
    "customField1" character varying(255),
    "customFieldMateriau" character varying(255),
    "codeExterne" character varying(100),
    "isNAcces" boolean NOT NULL,
    "isNPrelev" boolean NOT NULL,
    "justificationNV" text,
    "moyenAccesNV" text
);


ALTER TABLE public."(ADN_DIAG) PlombUniteDiag" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAI" (
    "idMission" integer NOT NULL,
    "NomEtablissement" character varying(500),
    "RaisonSociale" character varying(500),
    "typeEtablissement" character varying(100),
    "numeroSiret" character varying(255),
    "numVoie" character varying(50),
    "cptNumVoie" character varying(10),
    "typeVoie" character varying(10),
    "nomVoie" character varying(100),
    "cptAdresse" character varying(100),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "nomResponsableEtablissement" character varying(100),
    "prenomResponsableEtablissement" character varying(100),
    "nomProprio" character varying(100),
    "serviceProprio" character varying(100),
    "numVoieProprio" character varying(50),
    "cptNumVoieProprio" character varying(10),
    "typeVoieProprio" character varying(10),
    "nomVoieProprio" character varying(100),
    "cptAdresseProprio" character varying(100),
    "codePostalProprio" character varying(50),
    "villeProprio" character varying(50),
    "departementProprio" character varying(50),
    "paysProprio" character varying(50),
    "titreResponsableProprio" character varying(50),
    "nomResponsableProprio" character varying(100),
    "prenomResponsableProprio" character varying(100),
    "telephoneFixeProprio" character varying(50),
    "telephoneMobileProprio" character varying(50),
    "faxProprio" character varying(50),
    "emailProprio" character varying(255),
    "isExploitant" boolean,
    "qualiteIntervenant" character varying(500),
    "societeIntervenant" character varying(100),
    "numeroSiretSocieteIntervenant" character varying(255),
    "numVoieIntervenant" character varying(50),
    "cptNumVoieIntervenant" character varying(10),
    "typeVoieIntervenant" character varying(10),
    "nomVoieIntervenant" character varying(100),
    "cptAdresseIntervenant" character varying(100),
    "codePostalIntervenant" character varying(50),
    "villeIntervenant" character varying(50),
    "departementIntervenant" character varying(50),
    "paysIntervenant" character varying(50),
    "nomIntervenant" character varying(100),
    "prenomIntervenant" character varying(100),
    recommandations character varying(500),
    "isAutomatismes" boolean,
    "isGenererDocAnnexe" boolean,
    "attPerso1" character varying(100),
    "attPerso2" character varying(100),
    "attPerso3" character varying(100),
    "attPerso4" character varying(100),
    "typeSysteme" character varying(10),
    "detailSysteme" character varying(255),
    "typeMesure" character varying(5),
    "commentairePRI" text,
    "versionProtocole" character varying(20),
    "commentaireMesurage" text,
    "commentaireMF" text,
    "referenceAT" character varying(255),
    "modeleSV" character varying(255),
    "modeleEC" character varying(255),
    "modeleBE" character varying(255),
    "modeleBS" character varying(255),
    "modeleEA" character varying(255),
    "plagePressionBE1" real,
    "plagePressionBE2" real,
    "plageDebitBE1" real,
    "plageDebitBE2" real,
    "plagePressionBS1" real,
    "plagePressionBS2" real,
    "plageDebitBS1" real,
    "plageDebitBS2" real,
    "plageDebitEA1" real,
    "plageDebitEA2" real
);


ALTER TABLE public."(ADN_DIAG) QAI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIAppareil" (
    "idQAIApp" integer NOT NULL,
    "idMission" integer,
    nom character varying(255),
    marque character varying(255),
    modele character varying(255),
    "numSerie" character varying(255),
    fabriquant character varying(255),
    fournisseur character varying(255),
    "dateEtalonnage" timestamp without time zone,
    "portCom" character varying(6),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    emplacement text,
    "discAppareil" character varying(1),
    "typeMarque" character varying(50),
    "typeModele" character varying(50),
    "idEnumIFTAppareil" integer,
    "titreEtalonnage" character varying(100),
    "numeroEtalonnage" character varying(100),
    "organismeEtalonnage" character varying(255),
    "idInterlocuteurEtalonnage" integer,
    "dureeValiditeMoisEtalonnage" integer,
    "commentaireEtalonnage" text,
    "idResCertifEtalonnage" uuid,
    "previewDataCertifEtalonnage" bytea,
    "titreCertifEtalonnage" character varying(255),
    "idResConstatVerification" uuid,
    "previewDataConstatVerification" bytea,
    "titreConstatVerification" character varying(255),
    "plageEtalonnage" character varying(255),
    "programmeEtalonnageMin" text,
    "erreurMaxTolere" character varying(255),
    "uniteCoef" character varying(5)
);


ALTER TABLE public."(ADN_DIAG) QAIAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIElementEval; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIElementEval" (
    "idElement" integer NOT NULL,
    "discriminantElement" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idZone" integer,
    "discriminantZone" character varying(10),
    "typeValeur" character varying(10),
    "valeurNum" real,
    "valeurTxt" text,
    "valeurDate" timestamp without time zone,
    ordre integer,
    "isAuto" boolean,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" text,
    commentaire text,
    "attPerso1" character varying(100),
    "attPerso2" character varying(100),
    "valeurPR" text,
    "etatPR" character varying(100),
    "commentairePR" text,
    "isEP" boolean NOT NULL,
    "isVerifSuivi" boolean NOT NULL,
    "isMesure" boolean NOT NULL,
    "valeurMesure" real,
    "valeurMesureMarge" real,
    "isPlageMesure" boolean NOT NULL,
    "plageMesure1" real,
    "plageMesure2" real,
    "discriminantTypeMesure" character varying(5),
    "isNC" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) QAIElementEval" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIElementEvalPhoto; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIElementEvalPhoto" (
    "idPhoto" integer NOT NULL,
    "idElement" integer NOT NULL,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) QAIElementEvalPhoto" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIParam" (
    "idQAIParam" integer NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    "isAutomatismes" boolean,
    "isGenererDocAnnexe" boolean,
    "zoneDefaut" character varying(10),
    "qualiteIntervenantDefaut" character varying(500),
    "firstTabVisible" character varying(10),
    "isUseLstIntituleZone" boolean NOT NULL,
    "isValeurNumWarnings" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) QAIParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIRelEnumElementEval; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIRelEnumElementEval" (
    "idRelElement" integer NOT NULL,
    "discriminantElement1" integer NOT NULL,
    "valeurElement1" real,
    "valeurElement1Max" real,
    "discriminantElement2" integer NOT NULL,
    "isAfficherElement2" boolean,
    "isEditElement2" boolean,
    "isAddElement1ToElement2" boolean NOT NULL,
    "valeurAutoElement2" real,
    "valeurTxtElement2" text,
    "valeurDateElement2" timestamp without time zone,
    "isActif" boolean,
    ordre integer,
    "isParametrableByUser" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) QAIRelEnumElementEval" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIRelEnumElementEvalCalculable; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIRelEnumElementEvalCalculable" (
    "idRelElement" integer NOT NULL,
    "discriminantAutomatisant1" integer NOT NULL,
    "discriminantAutomatisant2" integer,
    "valeurConstante" real,
    "discriminantElementAuto" integer NOT NULL,
    action character varying(5),
    "isActif" boolean,
    ordre integer,
    "isParametrableByUser" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) QAIRelEnumElementEvalCalculable" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) QAIZone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) QAIZone" (
    "idZone" integer NOT NULL,
    "discriminantZone" character varying(10) NOT NULL,
    "idMission" integer NOT NULL,
    intitule character varying(255),
    "intituleInterne" character varying(255),
    "isNumerotationAuto" boolean,
    nombre integer,
    capacite real,
    "libelleCapacite" character varying(100),
    "uniteCapacite" character varying(50),
    localisation character varying(100),
    "isVisite" boolean NOT NULL,
    "justificationNvisite" text,
    "isConforme" boolean,
    "justificationNConforme" text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(255),
    "idZoneParent" integer,
    ordre integer,
    "attPerso1" character varying(10),
    "attPerso2" character varying(10),
    "attPerso3" character varying(10),
    "isHumide" boolean NOT NULL,
    niveau real,
    etage character varying(50),
    commentaire text,
    "typeBouche" character varying(10)
);


ALTER TABLE public."(ADN_DIAG) QAIZone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) RoleCourrier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) RoleCourrier" (
    "idRoleCourrier" integer NOT NULL,
    "idRole" integer,
    "jeuMatrice" character varying(255),
    chemin text,
    "isDefaut" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) RoleCourrier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) RoleInterlocuteurDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) RoleInterlocuteurDossier" (
    "idRole" integer NOT NULL,
    "dscRole" character varying(10),
    ordre integer,
    intitule character varying(255),
    "isDefaut" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    visible boolean NOT NULL,
    "isPerso" boolean NOT NULL,
    "dateFin" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) RoleInterlocuteurDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) StatutDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) StatutDossier" (
    "idStatut" integer NOT NULL,
    intitule character varying(255),
    ordre integer NOT NULL,
    "statutAuto" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) StatutDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Termite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Termite" (
    "idMission" integer NOT NULL,
    "libelleDocument" character varying(100),
    "titreDocument" character varying(255),
    "descriptifBien" text,
    "noteTermite" text,
    "moyenInvestigation" text,
    "idLoi" integer,
    "isGenererCertificat" boolean,
    "isGenererCommentaires" boolean,
    "isGenererMateriaux" boolean,
    "isGenererZone" boolean,
    "isSeparationDiag" boolean,
    "recapLocauxNV" text,
    "isGenererLocauxNV" boolean NOT NULL,
    "recapElementsNV" text,
    "isGenererElementsNV" boolean NOT NULL,
    "isGenererAnnexe" boolean,
    "nbPagesAnnexe" smallint,
    "idResMemoVocal" uuid,
    "idResMemoVocalDescriptifBien" uuid,
    "ChangeTime" timestamp without time zone,
    "isZoneDelimite" boolean NOT NULL,
    encombrement text,
    "isGenererAnnexePhoto" boolean NOT NULL,
    "isZone1335" boolean NOT NULL,
    "isZone1338" boolean NOT NULL,
    "traitementAnterieur" text,
    "infosOM" text,
    "isTermiteAC" boolean,
    "isConclusionAuto" boolean,
    "typeCharpente" character varying(255),
    "nbPans" integer,
    "isTraitementAnt" boolean NOT NULL,
    "typeTraitementAnt" character varying(255),
    "nbNivInf" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) Termite" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TermiteDiagElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TermiteDiagElement" (
    "idTermiteDiagElement" integer NOT NULL,
    "idTermiteElement" integer NOT NULL,
    "idParasite" integer,
    "idDegradation1" integer,
    "idDegradation2" integer,
    "idDegradation3" integer,
    "idDegradation4" integer,
    "idDegradation5" integer,
    "texteDebut" character varying(255),
    "texteMilieu" character varying(255),
    recap text,
    "isTermite" boolean,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    localisation character varying(100)
);


ALTER TABLE public."(ADN_DIAG) TermiteDiagElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TermiteElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TermiteElement" (
    "idTermiteElement" integer NOT NULL,
    "idTermiteLocal" integer,
    "lienDossierElement" text,
    "idCategorieElement" character varying(10),
    ordre integer,
    numero character varying(50),
    "nomElement" character varying(100),
    "nomSousElement" character varying(100),
    substrat character varying(100),
    revetement character varying(100),
    zone text,
    "isVisite" boolean,
    justification character varying(255),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" text,
    "customField1" character varying(255),
    "customFieldMateriau" character varying(255)
);


ALTER TABLE public."(ADN_DIAG) TermiteElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TermiteLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TermiteLocal" (
    "idTermiteLocal" integer NOT NULL,
    "idMission" integer NOT NULL,
    "idDossierLocal" uuid,
    ordre integer,
    code character varying(50),
    nom character varying(100),
    niveau real,
    etage character varying(50),
    "isVisite" boolean,
    justification text,
    commentaire text,
    "recapTermiteManuel" text,
    "recapAutreManuel" text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idResMemoVocal" uuid,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50),
    "moyenAccesNV" text
);


ALTER TABLE public."(ADN_DIAG) TermiteLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TermiteParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TermiteParam" (
    "idTermiteParam" integer NOT NULL,
    "idCategoriePrestation" character varying(50),
    "idTypePrestation" character varying(50),
    "texteDebut" character varying(255),
    "texteMilieu" character varying(255),
    "recapTermite" character varying(255),
    "recapAutre" character varying(255),
    "recapDefaut" character varying(255),
    "isGenererCommentaires" boolean,
    "isGenererMateriaux" boolean,
    "isGenererZone" boolean,
    "isGenererLocauxNV" boolean NOT NULL,
    "isGenererElementsNV" boolean NOT NULL,
    "isGenererAnnexe" boolean,
    "moyensInvestigation" text,
    "croquisBuilderPastilleLocal" text,
    "croquisBuilderPastilleElement" text,
    "croquisBuilderPastilleDiag" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isFusionMurs" boolean NOT NULL,
    "idNorme" integer,
    "isGenererAnnexePhoto" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG) TermiteParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TermiteParasiteDegradation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TermiteParasiteDegradation" (
    "idParasite" integer NOT NULL,
    "idDegradation" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) TermiteParasiteDegradation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TypeLogement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TypeLogement" (
    "idTypeLogement" integer NOT NULL,
    intitule character varying(255),
    "nbPiece" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer,
    "categorieBien" character varying(5),
    "idContrat" integer,
    code character varying(50)
);


ALTER TABLE public."(ADN_DIAG) TypeLogement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TypeLogementLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TypeLogementLocal" (
    "idTypeLogement" integer NOT NULL,
    "idLocal" integer NOT NULL,
    nb integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    ordre integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG) TypeLogementLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) TypeTxtStandard; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) TypeTxtStandard" (
    "idType" character varying(50) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) TypeTxtStandard" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) Vpe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) Vpe" (
    "idMission" integer NOT NULL,
    "isModificatonStructure" boolean,
    "NomResponsable" character varying(255),
    "NomDestinataireRapport" character varying(255),
    "MesurePriseTerre" real,
    "isPriseTerreConnecte" boolean,
    "RegimeNeutre" character varying(10),
    "TensionInstallation" real,
    "TypeCourant" character varying(50),
    "RefRapportInitial" character varying(255),
    "DateRapportInitial" timestamp without time zone,
    "RefRapportAnt" character varying(255),
    "DateRapportAnt" timestamp without time zone,
    "MesurePriseTerreAnt" real,
    "isPriseTerreAntConnecte" boolean,
    "isFiltragePdc" boolean,
    "isGenererGrille" boolean,
    "isGenererAnnexe" boolean,
    "nomAppareil" character varying(255),
    "numeroSerieAppareil" character varying(255),
    "marqueAppareil" character varying(255),
    "dateFabricationAppareil" timestamp without time zone,
    "dateRevisionAppareil" timestamp without time zone,
    "ChangeTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) Vpe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeAppareil" (
    "idAppareil" integer NOT NULL,
    "nomAppareil" character varying(255),
    "numeroSerie" character varying(255),
    marque character varying(255),
    "dateFabrication" timestamp without time zone,
    "dateRevision" timestamp without time zone,
    "idEmployeDefaut" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) VpeAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeAppareilMission; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeAppareilMission" (
    "idVpeAppareilMission" integer NOT NULL,
    "idMission" integer,
    "nomAppareil" character varying(255),
    "numSerieAppareil" character varying(255),
    "marqueAppareil" character varying(255),
    "dateFabrication" timestamp without time zone,
    "dateRevisionAppareil" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) VpeAppareilMission" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeDiagElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeDiagElement" (
    "idVpeDiagElement" integer NOT NULL,
    "idMission" integer,
    "idVpeLocal" integer,
    "idVpeTableau" integer,
    "idVpeElement" integer,
    localisation character varying(100),
    "nombreControle" integer,
    "isNonConformite" boolean,
    numero integer,
    observation text,
    "dateObservation" timestamp without time zone,
    preconisation text,
    "mesureContinuite" real,
    "mesureIsolement" real,
    "isMesuresConformes" boolean,
    "mesureDisjonction" real,
    "mesureTempsDisjonction" real,
    "idResPhoto" uuid,
    "titrePhoto" character varying(50),
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) VpeDiagElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeElement" (
    "idVpeElement" integer NOT NULL,
    "idVpeLocal" integer,
    "idVpeTableau" integer,
    "idCategorieElement" character varying(10),
    "nomElement" character varying(100),
    "nomSousElement" character varying(100),
    localisation character varying(100),
    cible character varying(255),
    etiquette character varying(255),
    "typeReseau" character varying(5),
    marque character varying(255),
    reference character varying(100),
    "puissanceTheorique" real,
    protection character varying(255),
    "classeProtection" integer,
    "indiceCoupure" character varying(255),
    calibre real,
    "sensibiliteDifferentiel" real,
    "isProtection" boolean,
    nombre integer,
    commentaire text,
    "isVisite" boolean,
    justification character varying(255),
    "idResPhoto" uuid,
    "titrePhoto" character varying(50),
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) VpeElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeLocal" (
    "idVpeLocal" integer NOT NULL,
    "idMission" integer,
    "idDossierLocal" uuid,
    ordre integer,
    nom character varying(100),
    niveau real,
    etage character varying(50),
    commentaire text,
    "indiceProtectionMin" character varying(50),
    capacite character varying(100),
    classement character varying(100),
    "isVisite" boolean,
    justification text,
    "idResPhoto" uuid,
    "titrePhoto" character varying(50),
    "previewDataPhoto" bytea,
    "idResMemoVocal" uuid,
    "idDossierBatiment" uuid,
    "idDossierLot" uuid,
    "numeroLot" character varying(50)
);


ALTER TABLE public."(ADN_DIAG) VpeLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeParam" (
    "idVpeParam" integer NOT NULL,
    "isFiltragePdc" boolean,
    "croquisBuilderPastille" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) VpeParam" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpePointControl; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpePointControl" (
    "idVpePointControl" integer NOT NULL,
    "idEnumVpePointControl" integer,
    "idMission" integer,
    resultat character varying(10),
    observation text,
    preconisation text,
    "isAuto" boolean
);


ALTER TABLE public."(ADN_DIAG) VpePointControl" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeRelPointControlDiagElement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeRelPointControlDiagElement" (
    "idVpeRelPointControlDiagElement" integer NOT NULL,
    "idEnumVpePointControl" integer NOT NULL,
    "idVpeDiagElement" integer NOT NULL,
    resultat character varying(10)
);


ALTER TABLE public."(ADN_DIAG) VpeRelPointControlDiagElement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) VpeTableau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) VpeTableau" (
    "idVpeTableau" integer NOT NULL,
    "idMission" integer,
    "idVpeLocal" integer,
    description character varying(100),
    localisation character varying(100),
    commentaire text,
    "isVisite" boolean,
    justification character varying(255),
    "idResPhoto" uuid,
    "titrePhoto" character varying(50),
    "previewDataPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG) VpeTableau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLCaracteristique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLCaracteristique" (
    "idCaracteristique" integer NOT NULL,
    "idCategorieElement" character varying(10),
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLCaracteristique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLCategorieQuestion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLCategorieQuestion" (
    "idCategorie" integer NOT NULL,
    intitule character varying(255),
    "discQuestion" character varying(5),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLCategorieQuestion" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLElementLocal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLElementLocal" (
    "idLocal" integer NOT NULL,
    "idElement" integer NOT NULL,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLElementLocal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLElementNature; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLElementNature" (
    "idElement" integer NOT NULL,
    "idNature" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLElementNature" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLElementObservation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLElementObservation" (
    "idElement" integer NOT NULL,
    "idObservation" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLElementObservation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLNature; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLNature" (
    "idNature" integer NOT NULL,
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLNature" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLNatureCaracteristique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLNatureCaracteristique" (
    "idCaracteristique" integer NOT NULL,
    "idNature" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLNatureCaracteristique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLObservation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLObservation" (
    "idObservation" integer NOT NULL,
    intitule character varying(255),
    valeur text,
    "discObservation" character varying(5),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLObservation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLQuestion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLQuestion" (
    "idQuestion" integer NOT NULL,
    ordre integer,
    question text,
    "idCategorie" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLQuestion" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumEDLTravaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumEDLTravaux" (
    "idTravaux" integer NOT NULL,
    "idCategorieTravaux" integer NOT NULL,
    "idCategorieElement" character varying(10),
    intitule character varying(50),
    valeur text,
    "prixTTC" double precision,
    "prixHT" double precision,
    tva double precision,
    "typePrix" character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumEDLTravaux" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumMarqueAppareil; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumMarqueAppareil" (
    "idMarque" integer NOT NULL,
    intitule character varying(255),
    "isECS" boolean,
    "isChauffage" boolean,
    "isCuisson" boolean,
    "isRefroidissement" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumMarqueAppareil" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG) enumQAIFamilleDocAnnexe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG) enumQAIFamilleDocAnnexe" (
    "familleDoc" character varying(5) NOT NULL,
    "idCategorieMission" character varying(50) NOT NULL,
    "idTypeMission" character varying(50) NOT NULL,
    intitule character varying(100),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG) enumQAIFamilleDocAnnexe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) EmetteurGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) EmetteurGenerateur" (
    "idSaisieEmetteur" integer,
    "idSaisieGenerateur" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) EmetteurGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) EnumereCombustible; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) EnumereCombustible" (
    "idEnumereCombustible" integer NOT NULL,
    "idTypeEnergie" integer NOT NULL,
    "libelleCombustible" character varying(100) NOT NULL,
    "libelleUnite" character varying(10) NOT NULL,
    "kwhParUnite" double precision NOT NULL,
    "kwhParUnite2" double precision,
    "coeffC02ch" real NOT NULL,
    "coeffCO2ecs" real NOT NULL,
    "coeffCO2refroidissement" real,
    "coeffC02chAutre" real NOT NULL,
    "coeffCO2ecsAutre" real NOT NULL,
    "coeffCO2refroidissementAutre" real,
    "coeffCO2ToutUsage" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) EnumereCombustible" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) EnumereTfonc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) EnumereTfonc" (
    "idFct" integer NOT NULL,
    "idGenerateur" integer,
    "idAnciennete" integer,
    "idAncEmet" integer,
    "Tfonc100B" double precision,
    "Tfonc30B" double precision,
    "Tfonc100M" double precision,
    "Tfonc30M" double precision,
    "Tfonc100H" double precision,
    "Tfonc30H" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) EnumereTfonc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) HSPValue; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) HSPValue" (
    "idHSPValue" integer NOT NULL,
    "idMission" integer,
    surface double precision,
    hauteur double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) HSPValue" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) ParamLog; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) ParamLog" (
    "tableName" character varying(100) NOT NULL,
    date timestamp without time zone,
    "SentAnchor" bytea,
    "ReceivedAnchor" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) ParamLog" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) ParamTombstone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) ParamTombstone" (
    "tableName" character varying(255),
    "rowId" character varying(50),
    "rowId2" character varying(50),
    "rowId3" character varying(50),
    "DeleteTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) ParamTombstone" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) ParamUser; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) ParamUser" (
    "idParamUser" integer NOT NULL,
    "idEmploye" integer,
    "HideAlertSimulationObsolete" boolean,
    "HideAlertDossierVerouille" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) ParamUser" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) QuoiAmeliorer; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) QuoiAmeliorer" (
    "KEYQuoiAmelioer" character varying(10) NOT NULL,
    "sujetAmelioration" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) QuoiAmeliorer" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEEmetteurGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEEmetteurGenerateur" (
    "idSaisieEmetteur" integer,
    "idSaisieGenerateur" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEEmetteurGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEEnumereCombustible; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEEnumereCombustible" (
    "idEnumereCombustible" integer NOT NULL,
    "idTypeEnergie" integer NOT NULL,
    "libelleCombustible" character varying(100) NOT NULL,
    "libelleUnite" character varying(10) NOT NULL,
    "kwhParUnite" double precision NOT NULL,
    "kwhParUnite2" double precision,
    "coeffC02ch" real NOT NULL,
    "coeffCO2ecs" real NOT NULL,
    "coeffCO2refroidissement" real,
    "coeffC02chAutre" real NOT NULL,
    "coeffCO2ecsAutre" real NOT NULL,
    "coeffCO2refroidissementAutre" real,
    "coeffCO2ToutUsage" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "isGranule" boolean,
    "isVisible" boolean,
    "coeffCO2ecl" real,
    "coeffCO2aux" real,
    "tauxEnr" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEEnumereCombustible" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEEnumereTfonc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEEnumereTfonc" (
    "idFct" integer NOT NULL,
    "idGenerateur" integer,
    "idAnciennete" integer,
    "idAncEmet" integer,
    "Tfonc100B" double precision,
    "Tfonc30B" double precision,
    "Tfonc100M" double precision,
    "Tfonc30M" double precision,
    "Tfonc100H" double precision,
    "Tfonc30H" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEEnumereTfonc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEHSPValue; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEHSPValue" (
    "idHSPValue" integer NOT NULL,
    "idMission" integer,
    surface double precision,
    hauteur double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEHSPValue" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEParamUser; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEParamUser" (
    "idParamUser" integer NOT NULL,
    "idEmploye" integer,
    "HideAlertSimulationObsolete" boolean,
    "HideAlertDossierVerouille" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEParamUser" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEQuoiAmeliorer; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEQuoiAmeliorer" (
    "KEYQuoiAmelioer" character varying(10) NOT NULL,
    "sujetAmelioration" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEQuoiAmeliorer" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPESaisieVeranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPESaisieVeranda" (
    "idVeranda" integer NOT NULL,
    "idSaisieLot" integer,
    "idMur" integer,
    "isMurIsole" boolean,
    libelle character varying(300),
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "idPosition" integer,
    "statutSaisie" integer NOT NULL,
    "bVer" double precision,
    "T" double precision,
    "Sse" double precision,
    "Ssind" double precision,
    "Sst" double precision,
    "Ssd" double precision,
    "isDbleOrientation" boolean,
    "idPosition2" integer,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "comAudit" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPESaisieVeranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEabonnementEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEabonnementEnergie" (
    "idAbonnementEnergie" integer NOT NULL,
    "idPrixEnergie" integer,
    "ABONNEMENTGAZ_idPrixEnergie" integer,
    "prixAboElectrique" double precision,
    "prixAboGaz" double precision,
    "aboElectriqueIsCollectif" boolean,
    "aboGazIsCollectif" boolean,
    "valeurAboElec" double precision,
    "valeurAboGaz" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "sImmGaz" double precision,
    "nbLogGaz" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEabonnementEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEaidePreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEaidePreconisation" (
    "idAide" integer NOT NULL,
    "idDetailPreconisation" integer,
    titre character varying(255),
    "ssTitre" character varying(255),
    detail text,
    "coutMin" double precision,
    "coutMax" double precision,
    "coutMoy" double precision,
    "isCoutMoy" boolean,
    "typeCout" character varying(15),
    montant double precision,
    "isIn" boolean,
    "idRes" uuid,
    lnk text,
    ordre integer,
    "pInter" double precision,
    "isPinter" boolean,
    "guidAide" character varying(50),
    "isEligibleMan" integer,
    "isElligible" integer,
    "isCee" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEaidePreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEassocDetailEnvMateriauxThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEassocDetailEnvMateriauxThBat" (
    "idAssocDetailEnvMateriauxThBat" integer NOT NULL,
    "idDetailEnveloppe" integer,
    libelle character varying(255),
    lambda double precision,
    epaisseur double precision,
    "isPourR" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEassocDetailEnvMateriauxThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEbatiment; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEbatiment" (
    "idBatiment" integer NOT NULL,
    "idSaisieLot" integer,
    nom character varying(255),
    shon real,
    surface real,
    "RPLSbien" character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEbatiment" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEbatimentLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEbatimentLot" (
    "idLot" integer NOT NULL,
    "idBatiment" integer,
    nom character varying(255),
    surface real,
    "surfaceHaut" real,
    "surfaceBas" real,
    "surfaceVerticale" real,
    "isDPE" boolean,
    "coeffIFC" double precision,
    groupe character varying(255),
    "nomBis" character varying(50),
    ville character varying(255),
    cp character varying(50),
    local character varying(255),
    rue character varying(255),
    type character varying(255),
    usage character varying(255),
    "surfaceBis" real,
    "dateConstruction" character varying(50),
    "dateRehab" character varying(50),
    plafond boolean,
    plancher boolean,
    mur boolean,
    batiment character varying(100),
    escalier character varying(100),
    etage character varying(80),
    porte character varying(100),
    "nLot" character varying(50),
    "idLotBis" integer,
    "resElec" double precision,
    "hasEnr1" boolean,
    "hasEnr2" boolean,
    "hasEnr3" boolean,
    "hasEnr4" boolean,
    "hasEnr5" boolean,
    "hasEnr6" boolean,
    "hasEnr7" boolean,
    "hasEnr8" boolean,
    "hasEnr9" boolean,
    "hasEnr10" boolean,
    "hasEnr11" boolean,
    "hasEnr12" boolean,
    "refADEME" character varying(50),
    "refTempADEME" character varying(50),
    "chWord" character varying(255),
    "chPDF" character varying(255),
    "consoNrj" double precision,
    "consoGes" double precision,
    "typeErrGen" integer,
    "typeErrTrans" integer,
    "msgErrGen" character varying(1000),
    "msgErrTrans" character varying(1000),
    "numDossierLot" integer,
    "refExterneDossierLot" character varying(255),
    "invFiscal" character varying(50),
    cust1 text,
    cust2 text,
    cust3 boolean,
    cust4 integer,
    cust5 double precision,
    "RPLSbien" character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEbatimentLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcategorieAudit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcategorieAudit" (
    "idCatAudit" integer NOT NULL,
    categorie character varying(255),
    "keyAmeliorer" character varying(10),
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "lexLibre" text,
    "lexFixe" text,
    "isLexModifiable" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcategorieAudit" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEclasseConsommationEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEclasseConsommationEnergie" (
    "idClasseConsommationEnergie" integer NOT NULL,
    "classConso_A" integer NOT NULL,
    "classConso_B" integer NOT NULL,
    "classConso_C" integer NOT NULL,
    "classConso_D" integer NOT NULL,
    "classConso_E" integer NOT NULL,
    "classConso_F" integer NOT NULL,
    "classConso_G" integer NOT NULL,
    "classConso_H" integer NOT NULL,
    "classConso_I" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEclasseConsommationEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEclasseEmissionGES; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEclasseEmissionGES" (
    "idClasseEmissionGES" integer NOT NULL,
    "classEmission_A" integer NOT NULL,
    "classEmission_B" integer NOT NULL,
    "classEmission_C" integer NOT NULL,
    "classEmission_D" integer NOT NULL,
    "classEmission_E" integer NOT NULL,
    "classEmission_F" integer NOT NULL,
    "classEmission_G" integer NOT NULL,
    "classEmission_H" integer NOT NULL,
    "classEmission_I" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEclasseEmissionGES" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcoeffKpbmRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffKpbmRconnu" (
    "idCoeffKpbmRconnu" integer NOT NULL,
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    kpbm double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffKpbmRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcoeffKtpmeRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffKtpmeRconnu" (
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    ktpme double precision NOT NULL,
    "idCoeffKtpmeRconnu" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffKtpmeRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcoeffLineiqueRefendMurExterieur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffLineiqueRefendMurExterieur" (
    "idCoeffLineiqueRefendMurExterieur" integer NOT NULL,
    "idEnumereConfiguration" integer,
    "idTypeNiveau" integer,
    "Lrem" double precision NOT NULL,
    "minSurface" integer NOT NULL,
    "maxSurface" integer NOT NULL,
    "NIV" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffLineiqueRefendMurExterieur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcoeffbCirc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffbCirc" (
    "idCoeffbCirc" integer NOT NULL,
    "isIsole" boolean NOT NULL,
    "isCirculationCentrale" boolean NOT NULL,
    "haveSAS" boolean NOT NULL,
    "isRDC" boolean NOT NULL,
    b double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    nom character varying(255),
    type character varying(50),
    "M" integer,
    "J" integer,
    occup boolean,
    "Nb" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcoeffbCirc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconseilPreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconseilPreconisation" (
    "idConseil" integer NOT NULL,
    "idDetailPreconisation" integer,
    "isIn" boolean,
    libelle character varying(255),
    conseil text,
    "coutMin" double precision,
    "coutMax" double precision,
    cout double precision,
    ordre integer,
    "pInter" double precision,
    c1 double precision,
    c2 double precision,
    bc3 boolean,
    tc4 text,
    "isInclusAide" integer,
    "isEligibleMprPa" integer,
    "isEligibleMprCopro" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconseilPreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstanteDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE" (
    "idConstanteDPE" integer NOT NULL,
    "arretePrixEnergie" character varying(255) NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "PeoDefaut" double precision NOT NULL,
    "coeffPpv" double precision NOT NULL,
    "coeffPco" double precision NOT NULL,
    "retrancheUfenetreSaisie" double precision NOT NULL,
    "retrancheUfenetreVolet" double precision NOT NULL,
    "retrancheUfenetreArgon" double precision NOT NULL,
    "TVA_recommandation" double precision NOT NULL,
    "TVA_autre" double precision NOT NULL,
    "nomMethode" character varying(50) NOT NULL,
    "versionMethode" character varying(10) NOT NULL,
    "nbDigitsGeneration" integer,
    "coeffUfenLocNonChauffe" double precision,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision,
    "isGenererEtiquette" boolean NOT NULL,
    "isGenererTextEtiquette" boolean NOT NULL,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "UmurInconnu" double precision,
    "UplafondInconnu" double precision,
    "UplancherInconnu" double precision,
    "TintCons" real,
    "TbaseExtH1" real,
    "TbaseExtH2" real,
    "TbaseExtH3" real,
    "TetaH1" real,
    "TetaH2" real,
    "TetaH3" real,
    "TextMoyH1" double precision,
    "TextMoyH2" double precision,
    "TextMoyH3" double precision,
    "isCalculInvestissementAuto" boolean,
    "PrevisualisationResultat" boolean,
    "IntervalCalculPrevisualisation" integer,
    "PrendreCompteERpourFactures" boolean,
    "GenerationDescLot" integer,
    "pieChartMode" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstanteDPE_IC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE_IC" (
    "idConstanteDPE_IC" integer NOT NULL,
    "Io" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "Rd1IsoleAeraulique" double precision NOT NULL,
    "Rd1IsoleHauteT" double precision NOT NULL,
    "Rd1IsoleBasseT" double precision NOT NULL,
    "Rd1Aeraulique" double precision NOT NULL,
    "Rd1HauteT" double precision NOT NULL,
    "Rd1BasseT" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "UmurIsoleLnc" double precision NOT NULL,
    "UmurLnc" double precision NOT NULL,
    "CORclimGaz" double precision NOT NULL,
    "PsTarifJaune" double precision,
    "AboTarfiJaune" double precision,
    "prixChauffageJaune" double precision,
    "prixECSJaune" double precision,
    "prixRefroidissementJaune" double precision,
    "CgazB2S" double precision,
    "aboGazB2S" double precision,
    "prixGazB2S" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "UporteVitr" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE_IC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstanteDPE_MI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE_MI" (
    "idConstanteDPE_MI" integer NOT NULL,
    "IauxSolaire" double precision NOT NULL,
    "Io" double precision NOT NULL,
    "cteCOMPLLeger" double precision NOT NULL,
    "cteCOMPLLourd" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "aRApuitProvencal" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "COR_ClimGaz" double precision NOT NULL,
    "kmenITE" double precision NOT NULL,
    "kpimITIrupteur" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "UporteVitr" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteDPE_MI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstanteGenerique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteGenerique" (
    "KEY_constanteGenerique" character varying(30) NOT NULL,
    "intValue" integer,
    "doubleValue" double precision,
    "textValue" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteGenerique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstantePontThermiqueIC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstantePontThermiqueIC" (
    "idConstantePontThermiqueIC" integer NOT NULL,
    "kpbemeITISsChape" double precision NOT NULL,
    "kpbemeITESsChape" double precision NOT NULL,
    "kpbemeAutreSsChape" double precision NOT NULL,
    "kpbemeITIAutre" double precision NOT NULL,
    "kpbemeITEAutre" double precision NOT NULL,
    "kpbemeAutreAutre" double precision NOT NULL,
    "kpbimeITISsChape" double precision NOT NULL,
    "kpbimeITESsChape" double precision NOT NULL,
    "kpbimeAutreSsChape" double precision NOT NULL,
    "kpbimeITIAutre" double precision NOT NULL,
    "kpbimeITEAutre" double precision NOT NULL,
    "kpbimeAutreAutre" double precision NOT NULL,
    "ktpmeChapeFlottanteITI" double precision NOT NULL,
    "ktpmePRE1982" double precision NOT NULL,
    "ktpmePlancherBasIsole" double precision NOT NULL,
    "kttemeITI" double precision NOT NULL,
    "kttemeITE" double precision NOT NULL,
    "kttemeAutre" double precision NOT NULL,
    "kttimeITI" double precision NOT NULL,
    "kttimeITE" double precision NOT NULL,
    "kttimeAutre" double precision NOT NULL,
    "ktcmeITILourd" double precision NOT NULL,
    "ktcmeITELourd" double precision NOT NULL,
    "ktcmeAutreLourd" double precision NOT NULL,
    "ktcmeITILeger" double precision NOT NULL,
    "ktcmeITELeger" double precision NOT NULL,
    "ktcmeAutreLeger" double precision NOT NULL,
    "krfmeITI" double precision NOT NULL,
    "krfmeITE" double precision NOT NULL,
    "krfmeAutre" double precision NOT NULL,
    "Klnc" double precision NOT NULL,
    kpibme double precision NOT NULL,
    "kpibmeITIandRupteur" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstantePontThermiqueIC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstanteVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteVentilation" (
    "idCte" integer NOT NULL,
    "keyVent" character varying(50),
    "Valeur" double precision,
    "xDpe" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstanteVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEconstantesPontThermiqueMI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEconstantesPontThermiqueMI" (
    "idConstantesPontThermiqueMI" integer NOT NULL,
    "kpbmVideSan" double precision NOT NULL,
    "kpbmVideSanITI" double precision NOT NULL,
    "kpbmChapeITI" double precision NOT NULL,
    "kpbmPre1982" double precision NOT NULL,
    "kpbmPre1982ITE" double precision NOT NULL,
    "kpbmPost1982" double precision NOT NULL,
    "kpbmPost1982ITE" double precision NOT NULL,
    "krfmITE" double precision NOT NULL,
    "krfmNonITE" double precision NOT NULL,
    krfpb double precision NOT NULL,
    "KpbmExt" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEconstantesPontThermiqueMI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEcotePiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEcotePiece" (
    "idCotePiece" integer NOT NULL,
    "idPieceSaisie" integer,
    "libelleCotePiece" character varying(50) NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEcotePiece" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdataAdeme; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdataAdeme" (
    "idData" integer NOT NULL,
    "keyData" character varying(255),
    tv integer,
    "idLib1" integer,
    "idLib2" integer,
    "idLib3" integer,
    "Lib1" boolean,
    "Lib2" boolean,
    "Lib3" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdataAdeme" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailByEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailByEmetteur" (
    "idDetail" integer NOT NULL,
    "idSaisieGenerateur" integer,
    "idSaisieEmetteur" integer,
    "Rg" double precision,
    "Ich" double precision,
    "COPnom" double precision,
    "CchPCI" double precision,
    "mCch" double precision,
    "mCchEpM2" double precision,
    "I0" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailByEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailCalcul; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailCalcul" (
    "idSaisieLot" integer NOT NULL,
    "ENV" double precision,
    "DPmurs" double precision,
    "DPplafond" double precision,
    "DPplancher" double precision,
    "DPvitrage" double precision,
    "DPverandas" double precision,
    "DPportes" double precision,
    "aRA" double precision,
    "PT" double precision,
    "METEO" double precision,
    "INT_ermitence" double precision,
    "CLIMAT" double precision,
    "COMPL" double precision,
    "CchInd" double precision,
    "CchColl" double precision,
    "CecsInd" double precision,
    "CecsColl" double precision,
    "IauxInd" double precision,
    "IauxColl" double precision,
    "CauxInd" double precision,
    "CauxColl" double precision,
    "Bch" double precision,
    "Becs" double precision,
    "Smurs" double precision,
    "Stoit" double precision,
    "Splancher" double precision,
    "Svitrage" double precision,
    "Sverandas" double precision,
    "Sportes" double precision,
    "CchPCI" double precision,
    "CecsPCI" double precision,
    "CclimPCI" double precision,
    "CusagesRecensesPCI" double precision,
    "CauxPCI" double precision,
    "CauePCI" double precision,
    "CaugPCI" double precision,
    "CeclPCI" double precision,
    "CascenseurPCI" double precision,
    "CchEP" double precision,
    "CecsEP" double precision,
    "CclimEP" double precision,
    "CusagesRecensesEP" double precision,
    "CauxEP" double precision,
    "CaueEP" double precision,
    "CaugEP" double precision,
    "CeclEP" double precision,
    "CascenseurEP" double precision,
    "CchCO2" double precision,
    "CecsCO2" double precision,
    "CclimCO2" double precision,
    "CauxCO2" double precision,
    "CaueCO2" double precision,
    "CaugCO2" double precision,
    "CeclCO2" double precision,
    "CascenseurCO2" double precision,
    "Dch" double precision,
    "Decs" double precision,
    "Dclim" double precision,
    "DusagesRecenses" double precision,
    "Daux" double precision,
    "Decl" double precision,
    "Dascenseur" double precision,
    "Dtotal" double precision,
    "consommationAnnuelleEP" double precision,
    "consommationAnnuelleEPParm2" double precision,
    "emissionsGESAnnuelle" double precision,
    "emissionsGESAnnuelleParm2" double precision,
    "productionEnergieRenouvelableEP" double precision,
    "BV" double precision,
    "GV" double precision,
    "F" double precision,
    "Prs1" double precision,
    "Prs2" double precision,
    "mCchSolaire" double precision,
    "mCchAppointElec" double precision,
    "mCch" double precision,
    "mCchElectricite" double precision,
    "mCchGaz" double precision,
    "mCchFioul" double precision,
    "mCchBois" double precision,
    "mCchRCU" double precision,
    "mCchCharbon" double precision,
    "mCchPropane" double precision,
    "mCchEpM2" double precision,
    "Ps" double precision,
    "mBch" double precision,
    "mGV" double precision,
    "Sse" double precision,
    "Ai" double precision,
    "As" double precision,
    "E" double precision,
    "I0" double precision,
    "INT" double precision,
    "Inertie" character varying(50),
    "CauxVent" double precision,
    "SseVeranda" double precision,
    "AsVeranda" double precision,
    "ClimLogement" double precision,
    "EautoConso" double precision,
    "CauxVentPCI" double precision,
    "CauxVentEP" double precision,
    "CauxVentCO2" double precision,
    "CauxFroidPCI" double precision,
    "CauxFroidEP" double precision,
    "CauxFroidCO2" double precision,
    "CauxEcsPCI" double precision,
    "CauxEcsEP" double precision,
    "CauxEcsCO2" double precision,
    "CauxChaPCI" double precision,
    "CauxChaEP" double precision,
    "CauxChaCO2" double precision,
    "EquiVoiturKm" double precision,
    "Bfr" double precision,
    "mCecs" double precision,
    "mCecsBois" double precision,
    "mCecsElec" double precision,
    "mCecsFioul" double precision,
    "mCecsGaz" double precision,
    "mCecsPropane" double precision,
    "mCecsRcu" double precision,
    "CventPCI" double precision,
    "mPpv" double precision,
    "mQcirc" double precision,
    "mCtotalPv" double precision,
    "Sse1" double precision,
    "Sse2" double precision,
    "Sse3" double precision,
    "Sse4" double precision,
    "Sse5" double precision,
    "Sse6" double precision,
    "Sse7" double precision,
    "Sse8" double precision,
    "Sse9" double precision,
    "Sse10" double precision,
    "Sse11" double precision,
    "Sse12" double precision,
    "BecsDepensier" double precision,
    "CecsDepensier" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailCalcul" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailClimatisation" (
    "idDetailClimatisation" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereSystemeClimatisation" integer,
    "idEnumereIauxClimatisation" integer,
    "descriptionClimatisation" character varying(255),
    "libelleSysteme" character varying(255),
    "pourcentageSurfaceClim" double precision,
    "CclimEP" double precision,
    "libelleEnergie" character varying(30),
    "prix_kWh_clim" double precision,
    "statutSaisie" integer NOT NULL,
    "surfaceClimatisee" double precision,
    "surfaceClimatiseeDernierEtage" double precision,
    "idEnumereCombustible" integer,
    "dateFabrication" timestamp without time zone,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    descriptif text,
    "periodeInstallation" integer,
    "keySource" integer,
    "SEER" double precision,
    "isSEERconnu" boolean,
    "isCollectif" boolean,
    "idTypeEnergie" integer,
    "EER" double precision,
    "Cfr" double precision,
    "CfrDepensier" double precision,
    "Bfr" double precision,
    "cleRepartition" double precision,
    entretien text,
    "Pcirc" double precision,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "comAudit" text,
    "idEtatEquipement" integer,
    "comEtatEquipement" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEclairage" (
    "idDetailEclairage" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL,
    "idTypeEnergie" integer,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "comAudit" text,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailEnergies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEnergies" (
    "idDetailEnergies" integer NOT NULL,
    "idSaisieLot" integer,
    "presenceGazIndividuel" boolean NOT NULL,
    "gazCuisson" boolean NOT NULL,
    "presenceGPL" boolean NOT NULL,
    "citerneGPLLocation" boolean NOT NULL,
    "citerneGPLAchete" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEnergies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailEnveloppe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEnveloppe" (
    "idDetailEnveloppe" integer NOT NULL,
    "libelleDetailEnveloppe" character varying(50) NOT NULL,
    surface double precision,
    "U" double precision,
    "coeffCorrecteur" double precision,
    "surfaceSaisie" double precision,
    "Usaisie" double precision,
    "statutSaisie" integer NOT NULL,
    "H" double precision,
    "L" double precision,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "comAudit" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEnveloppe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEquipementDivers" (
    "idDetailEquipementDivers" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailFicheTechnique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailFicheTechnique" (
    "idDetailFt" integer NOT NULL,
    idft integer,
    valeur text,
    "keySource" integer,
    "detailSource" character varying(255),
    type character varying(50),
    "Jour" integer,
    "Heure" integer,
    "Mois" integer,
    "detailValeur" double precision,
    "isInclus" boolean,
    c1 double precision,
    c2 double precision,
    c3 double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailFicheTechnique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailImmeuble" (
    "idMission" integer NOT NULL,
    "idEnumerCORPlafond" integer,
    "SHbat" double precision,
    "nbNiveaux" real,
    "HSPmoyenne" double precision,
    "typeToiture" character varying(30),
    "SH_DernierEtage" double precision,
    "nbLogements" integer,
    "Shmoy" double precision,
    "nomCC" character varying(255),
    "NbrCircVerticaleCC" integer,
    "ScommercialeCC" double precision,
    "naturePrivativeCC" character varying(255),
    "hasSegmentationCC" boolean,
    "nbLogementsNonVisites" integer,
    "SpartieCommune" double precision,
    "isGestionHomogene" double precision,
    "surfaceReference" double precision,
    "isMonopropriete" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailInformationLogement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailInformationLogement" (
    "idMission" integer NOT NULL,
    "idEnumerePlageAltitude" integer,
    "idEnumereConfigurationAppartement" integer,
    "idEnumereAnneeConstruction" integer,
    dpt character varying(2),
    "idEnumereMIT" integer,
    "idEnumereConfiguration" integer,
    "anneeConstruction" character varying(30),
    "hauteurSsPlafond" double precision,
    "altitudeSaisie" double precision,
    "vitrageSudEnsolleilles" boolean,
    "surfaceHabitable" double precision,
    "nombreNiveaux" double precision,
    "MIT" double precision,
    "FOR_me" double precision,
    "perimetreSaisie" double precision,
    "comblesHabite" boolean,
    "pourcentageSurfaceSol" double precision,
    "pourcentageSurfaceComble" double precision,
    "pourcentageSurfaceTerrasse" double precision,
    etage character varying(50),
    "isDernierEtage" boolean,
    sas boolean,
    "perimetreSurExterieurNiv2" double precision,
    "perimetreSurExterieurNiv1" double precision,
    "perimetreSurExterieurNiv3" double precision,
    "circulationCentrale" boolean,
    "perimetreSurPartiesCommunes" double precision,
    "chauffageCentralSansComptage" boolean,
    "presenceAscenseur" boolean,
    millieme integer,
    "milliemeBase" integer,
    "nbOccupants" character varying(50),
    "keyInertie" character varying(50),
    "hasRegulParPiece" boolean,
    "idInter" integer,
    "idTypeChauffage" integer,
    "isCI" boolean,
    "idEmet" integer,
    "isERP" boolean,
    "idResFaceSud" uuid,
    "previewFaceSud" bytea,
    "idResFaceNord" uuid,
    "previewFaceNord" bytea,
    "idResFaceEst" uuid,
    "previewFaceEst" bytea,
    "idResFaceOuest" uuid,
    "previewFaceOuest" bytea,
    commentaire text,
    "idResVentilation" uuid,
    "previewVentilation" bytea,
    "tempChaufJour" character varying(50),
    "tempChaufNuit" character varying(50),
    "nbJourInoccupeAvecChauf" integer,
    "nbJourInoccupeSansChauf" integer,
    "nbOccupant" integer,
    "utilisationECS" character varying(255),
    "utilisationEclairage" character varying(255),
    "presenceAmpouleEco" character varying(255),
    "idResEnvSud" uuid,
    "previewEnvSud" bytea,
    "idResEnvNord" uuid,
    "previewEnvNord" bytea,
    "idResEnvEst" uuid,
    "previewEnvEst" bytea,
    "idResEnvOuest" uuid,
    "previewEnvOuest" bytea,
    orientation1 character varying(255),
    orientation2 character varying(255),
    orientation3 character varying(255),
    orientation4 character varying(255),
    "isCopro" boolean,
    "idTypeERP" integer,
    "idCatERP" integer,
    "coeffIFC" double precision,
    "isAncien" integer,
    "typeCopro" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailInformationLogement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailMasqueLointain; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMasqueLointain" (
    "idMasque" integer NOT NULL,
    "idSaisieLot" integer,
    "keyParoi" character varying(10),
    "keyOrientation" character varying(10),
    "isHomogene" boolean,
    "alphaHomogene" real,
    "alphaLE" real,
    "alphaCE" real,
    "alphaCO" real,
    "alphaLO" real,
    libelle character varying(250),
    "isDefaut" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMasqueLointain" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailMurPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMurPorte" (
    "detailMur" integer,
    "detailPorte" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMurPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailMurPorteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMurPorteur" (
    "detailFenetre" integer,
    "detailMur" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailMurPorteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailNiveauImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailNiveauImmeuble" (
    "idDetailNiveauImmeuble" integer NOT NULL,
    "idMission" integer,
    "perimetreSurExterieur" double precision,
    "nbNiveauxIdentique" integer,
    numero character varying(50),
    libelle character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailNiveauImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailPlafondPorteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPlafondPorteur" (
    "idDetailFenetre" integer,
    "idDetailPlafond" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPlafondPorteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailPontThermique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPontThermique" (
    "idPT" integer NOT NULL,
    "idSaisieLot" integer,
    "keyLineique" character varying(50),
    "keySource" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPontThermique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailPreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPreconisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idSaisieLot" integer,
    "preconisationTexte" text,
    "coutMin" double precision,
    "coutMax" double precision,
    "creditImpot" double precision,
    "commentairePreconisation" text,
    "isAutoApplique" boolean,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "isIn" boolean,
    "typeCredit" integer,
    "Contrainte" character varying(255),
    "PerfRecommandee" character varying(255),
    "categorieAu" character varying(255),
    "sousCategorieAu" character varying(255),
    "keyCategorieAu" character varying(10),
    "tarifMoy" double precision,
    "isTarifMoy" boolean,
    "dureeMin" double precision,
    "dureeMax" double precision,
    "dureeMoy" double precision,
    "isDureeMoy" double precision,
    "typeDureeMoy" character varying(15),
    "isForfaitDuree" boolean,
    "totAideMin" double precision,
    "totAideMax" double precision,
    "totAideMoy" double precision,
    "isAideMoy" boolean,
    "typeAide" character varying(15),
    "isInAudit" boolean,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "lexLibre" text,
    "lexFixe" text,
    "isLexModifiable" boolean,
    "titreLex" character varying(255),
    ordre integer,
    "isAvantage" boolean,
    "hasDerog" integer,
    derog text,
    "lElement" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailPreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEmetteur" (
    "idSaisieEmetteur" integer NOT NULL,
    "Rd" double precision,
    "Re" double precision,
    "Rr" double precision,
    "Rg" double precision,
    "Ich" double precision,
    "COPnom" double precision,
    "IchBase" double precision,
    "CchPCI" double precision,
    "idTypeEmetteur" integer,
    emetteur character varying(255),
    "hasRobinetThermo" boolean,
    "hasRegTherm" boolean,
    "isBasseT" boolean,
    "isChalDouce" boolean,
    "idAncEmet" integer,
    "mCch" double precision,
    "mCchEpM2" double precision,
    "I0" double precision,
    "INT" double precision,
    "Bch" double precision,
    "Pch" double precision,
    "idEnumereReseauDistribution" integer,
    "isDivise" boolean,
    "hasIntRegul" boolean,
    "idInter" integer,
    "isInterMixte" boolean,
    "surfaceChauffee" double precision,
    "Prs1" double precision,
    "Prs2" double precision,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "Rd0" double precision,
    "keyEmplacement" character varying(5),
    "KEY_reseauDistribution" character varying(10),
    "rR0" double precision,
    "isResIsole" boolean,
    "isMonotube" boolean,
    "isComptageIndiv" boolean,
    "Tv" integer,
    entretien text,
    "anneeInstallation" integer,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "comAudit" text,
    "idEtatEquipement" integer,
    "comEtatEquipement" text,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEnvFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvFenetre" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUfenetre" integer,
    "idSaisieLot" integer,
    "idSaisieVitrage" integer NOT NULL,
    "descriptionFenetre" character varying(255),
    "Ucalcul" double precision,
    "Ksaisie" double precision,
    "isFenetreToit" boolean NOT NULL,
    "isITE" boolean NOT NULL,
    "isLocalNonChauffe" boolean NOT NULL,
    "keyParoi" character varying(50),
    "isDbleFenetre" boolean,
    "idVitrage" integer,
    "isVir" boolean,
    "isKrypton" boolean,
    "idUg" integer,
    "Ug" double precision,
    epaisseur real,
    "idMenuiserie" integer,
    "idParoiVitree" integer,
    "Uw" double precision,
    "idFermeture" integer,
    "Ujn" double precision,
    "idEnumereCorBaie" integer,
    "idEnumereDetailCorBaie" integer,
    "Aiu" real,
    "Aue" real,
    b real,
    "isParoiIso" boolean,
    "isIsoLnc" boolean,
    "idLnc" integer,
    "isFondLoggia" boolean,
    "isAuvent" boolean,
    avancee real,
    "L1" real,
    "L2" real,
    "isLateral" boolean,
    "isRetourSud" boolean,
    "alphaHomogene" real,
    "isMhomogene" boolean,
    "isMnonHomogene" boolean,
    "idPosition" integer,
    "idInclinaison" integer,
    "isNu" integer,
    "idLp" integer,
    "hasRetourIso" boolean,
    "idVitrage2" integer,
    "isVir2" boolean,
    "isKrypton2" boolean,
    "idUg2" integer,
    "Ug2" double precision,
    epaisseur2 real,
    "idMenuiserie2" integer,
    "idParoiVitree2" integer,
    "idUw2" integer,
    "Uw2" double precision,
    "Fts" double precision,
    "Fts2" double precision,
    "FtsSaisie" double precision,
    "Fts2Saisie" double precision,
    "idPositionFacade" integer,
    "isNu2" integer,
    "idLp2" integer,
    "hasRetourIso2" boolean,
    descriptif text,
    "avanceeLoggia" real,
    "isVeranda" boolean,
    "nomVeranda" character varying(500),
    "isOriVeranda" boolean,
    "isMasqueFacade" boolean,
    "Uw2saisie" double precision,
    "Ug2saisie" double precision,
    "Sw1saisie" double precision,
    "Sw2saisie" double precision,
    "idPositionVeranda" integer,
    "idMenuiserieVeranda" integer,
    "keyVitrageVeranda" character varying(10),
    "keySource" integer,
    "idVeranda" integer,
    "isRemplInconnu" boolean,
    "isRemplInconnu2" boolean,
    "UjnSaisie" double precision,
    "isLncIsoInconnu" boolean,
    entretien text,
    "Nbmotif" integer,
    "Nbcaclule" double precision,
    "keyMotif" character varying(100),
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "idResPhMasque" uuid,
    "previewPhMasque" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEnvMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvMur" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUmurD" integer,
    "idSaisieIsolant" integer,
    "idEnumereUmurInconnu" integer,
    "idEnumereUmur0" integer,
    "idEnumereTypeMur" integer,
    "idSaisieLot" integer,
    "idEnumereCORmur" integer,
    "typeParoi" character varying(255),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITE" boolean,
    "ITI" boolean,
    "ITR" boolean,
    "hasRupteur" boolean NOT NULL,
    "UsaisieContainsR" boolean NOT NULL,
    "idEnumereDetailCORmur" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "isIsoConnue" boolean,
    "detailIsLourd" integer,
    "idOrientation" integer,
    "idInclinaison" integer,
    descriptif text,
    "hasReduit" boolean,
    "anneeExtension" integer,
    "isParoiAncienne" boolean,
    "idPositionVeranda" integer,
    "idMenuiserieVeranda" integer,
    "keyVitrageVeranda" character varying(10),
    "keySource" integer,
    "idPosition" integer,
    "U0saisie" double precision,
    "idVeranda" integer,
    "lstNiveau" text,
    "isLncIsoInconnu" boolean,
    "isMatLourd" boolean,
    "isOssatureBois" boolean,
    "isIsoNat" boolean,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlafond" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumerCORPlafond" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplafond0" integer,
    "idEnumereUplafondInconnu" integer,
    "idEnumereUplafondD" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITI" boolean,
    "ITE" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean,
    "idEnumereDetailCORPlafond" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "isIsoConnue" boolean,
    "detailIsLourd" integer,
    "idOrientation" integer,
    "idInclinaison" integer,
    descriptif text,
    "anneeExtension" integer,
    "isParoiAncienne" boolean,
    "idPositionVeranda" integer,
    "idMenuiserieVeranda" integer,
    "keyVitrageVeranda" character varying(10),
    "keySource" integer,
    "U0saisie" double precision,
    "idVeranda" integer,
    "lstNiveau" text,
    "isLncIsoInconnu" boolean,
    "isMatLourd" boolean,
    "isOssatureBois" boolean,
    "isIsoNat" boolean,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlancher" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplancherD" integer,
    "idEnumereUplancherInconnu" integer,
    "idEnumereUplancher0" integer,
    "idEnumereCORsol" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "isolationSsChape" boolean,
    "ITE" boolean,
    "ITI" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean,
    "idEnumereDetailCORsol" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isIsoConnue" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "detailIsLourd" integer,
    "perimetreTP" double precision,
    "surfaceTP" double precision,
    descriptif text,
    "anneeExtension" integer,
    "isParoiAncienne" boolean,
    "keySource" integer,
    "U0saisie" double precision,
    "idVeranda" integer,
    "lstNiveau" text,
    "isLncIsoInconnu" boolean,
    "isMatLourd" boolean,
    "isOssatureBois" boolean,
    "isIsoNat" boolean,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPorte" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereUporte" integer,
    "descriptionPorte" character varying(255),
    "donneSurLNC" boolean NOT NULL,
    "isIsole" boolean NOT NULL,
    "hasSAS" boolean NOT NULL,
    "idEnumereCorMur" integer,
    "idEnumereDetailCorMur" integer,
    "Aiu" real,
    "Aue" real,
    b real,
    "isIsoLnc" boolean,
    "isParoiIso" boolean,
    "idLnc" integer,
    "idMur" integer,
    "isNu" integer,
    "idLp" integer,
    "hasRetourIso" boolean,
    descriptif text,
    "isIsoDblV" boolean NOT NULL,
    "idPositionVeranda" integer,
    "idMenuiserieVeranda" integer,
    "keyVitrageVeranda" character varying(10),
    "keySource" integer,
    "idVeranda" integer,
    "isPorteInconnue" boolean,
    "isLncIsoInconnu" boolean,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieEnvPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieFacture" (
    "idDetailSaisieFacture" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idGroupementFacture" integer,
    "idTypeEnergie" integer,
    "refDocument" character varying(50),
    "typeDocument" character varying(50),
    "depenseFacture" double precision,
    "quantiteEnergie" double precision,
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "dureeMois" double precision,
    "dateFacture" timestamp without time zone,
    "statutSaisie" integer,
    "isCollectif" boolean,
    "dateFinFacture" timestamp without time zone,
    "isRachat" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieGenerateur" (
    "idSaisieGenerateur" integer NOT NULL,
    "Fctindependant" boolean,
    "idGenerateur" integer,
    "idSaisieLot" integer,
    "nomInstall" character varying(50),
    "keyInstall" integer,
    "idInstall" integer,
    "idEnumereCombustible" integer,
    "isECS" boolean,
    "isChauffage" boolean,
    "isCollectif" boolean,
    "isIndividuel" boolean,
    "hasComptageInd" boolean,
    "descriptionChauffage" character varying(255),
    "descriptionECS" character varying(255),
    "presenceProgrammateur" boolean,
    "hasInstallationSolaireCh" boolean,
    "Fch_saisie" double precision,
    "Ich" double precision,
    "IchBase" double precision,
    "libelleEnergie" character varying(30),
    "Bch" double precision,
    "CchPCI" double precision,
    "Rg" double precision,
    "idRegulationPAC" integer,
    "COPdecl" double precision,
    "COPnom" double precision,
    "Cregul" double precision,
    "isNeuf" boolean,
    "hasCogeneration" boolean,
    "Nindependant" integer,
    "isPrioritaire" boolean,
    "hasRegul" boolean,
    "hasCondenFumee" boolean,
    "Prel" double precision,
    "Pnom" double precision,
    "Rpn" double precision,
    "Rpint" double precision,
    "idAnciennete" integer,
    "Tfonc100" double precision,
    "Tfonc30" double precision,
    "Pmfou" double precision,
    "Pmcons" double precision,
    "QP0" double precision,
    "Pveil" double precision,
    "hasVentilo" boolean,
    "isAirChaudCondens" boolean,
    "PcogeneEst" double precision,
    "PcogeneSaisie" double precision,
    "FctPrincipal" boolean,
    "FctRelevePAC" boolean,
    "FctCascade" integer,
    "FctCascadePriorite" boolean,
    "FctAppoint" boolean,
    "FctChauffageElec" boolean,
    "FctApointChaudierePAC" boolean,
    "FctBaseCollectif" boolean,
    "RsEcs" double precision,
    "RdEcs" double precision,
    "RgEcs" double precision,
    "CecsPCI" double precision,
    "ecsSolaire" boolean NOT NULL,
    "ecsSolaireVieux" boolean NOT NULL,
    veilleuse boolean NOT NULL,
    "FecsSaisie" double precision,
    "Iecs" double precision,
    "IecsBase" double precision,
    "isGRS" boolean,
    "prodVolHab" boolean,
    "PieceAlimContigu" boolean,
    "idRd" integer,
    "reseauIsole" boolean,
    "Vs" double precision,
    "Qgw" double precision,
    "Cr" double precision,
    "Cef" double precision,
    "ballonVolHab" boolean,
    "idCef" integer,
    "airExterieur" boolean,
    "COPecs" double precision,
    "idConduite" integer,
    "idDistrib" integer,
    "hasAppointECS" boolean,
    "hasBallonAccu" boolean,
    "InVolChauf" boolean,
    "statutSaisie" integer,
    "hasRapportChaudiere" boolean,
    "rapprtNonRequis" boolean,
    "dateFabrication" timestamp without time zone,
    "isNumeric" boolean,
    "nbPage" smallint,
    chemin character varying(255),
    commentaire text,
    "isMethodeMixte" boolean,
    "rachatEDFch" double precision,
    "rachatEDFecs" double precision,
    "isFactECS" boolean,
    "isFactCH" boolean,
    "Ni" integer,
    "Ne" integer,
    "Shi" double precision,
    "She" double precision,
    "SurfaceImmeuble" double precision,
    "isMural" boolean,
    "FctReleveBois" boolean,
    "Nich" integer,
    "Nech" integer,
    "Shich" double precision,
    "Shech" double precision,
    "Becs" double precision,
    "surfaceECS" double precision,
    "Prs2" double precision,
    "isCollectifECS" boolean,
    "isIndividuelECS" boolean,
    "Pch" double precision,
    "Pecs" double precision,
    "Prs1" double precision,
    "idAboElec" integer,
    "idAboGaz" integer,
    "idResRapportInsp" uuid,
    "previewDataRapportInsp" bytea,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "idTypePacEcs" integer,
    descriptif text,
    "CauxCh" double precision,
    "CauxEcs" double precision,
    "keyCategorie" character varying(10),
    "COPecsDecl" double precision,
    "idAncienneteECS" integer,
    "idIsoReseau" integer,
    "idDistrReseau" integer,
    "nbVentilo" integer,
    "isHybrid" boolean,
    "idAncHybrid" integer,
    "scopHybrid" double precision,
    "idPcirc" integer,
    "typePAChybrid" integer,
    "hasTracage" boolean,
    "hasStockIntegre" boolean,
    "keySourceChauffage" integer,
    "keySourceEcs" integer,
    "isDefautPenalisant" boolean,
    "idTypeEnergie2" integer,
    "idCombustible2" integer,
    "keyBouclage" integer,
    "isMultiBatiment" boolean,
    "CecsDepensier" double precision,
    "BecsDepensier" double precision,
    "Marque" character varying(255),
    "Rs" double precision,
    "isBiEnergie" boolean,
    "typeCet" integer,
    "idMethode" integer,
    "isPCS" boolean,
    "PnomDefaut" double precision,
    "RpnDefaut" double precision,
    "RpintDefaut" double precision,
    "Qp0Defaut" double precision,
    "PveilDefaut" double precision,
    "Tfonc100Defaut" double precision,
    "Tfonc30Defaut" double precision,
    "BchDepensier" double precision,
    "CchDepensier" double precision,
    "coeffIFC" double precision,
    "PchSolaire" double precision,
    "PecsSolaire" double precision,
    "TvCombustionId" integer,
    "TvTfonc100" integer,
    "TvTfonc30" integer,
    "TvScop" integer,
    "QcircCh" double precision,
    "Cchm2" double precision,
    "Cecsm2" double precision,
    "PartEfChauf" double precision,
    "CchSdb" double precision,
    "QcircEcs" double precision,
    "typeProdEcs" integer,
    "entretienChauffage" text,
    "entretienEcs" text,
    "entretienDistrib" text,
    "BiCauxCh" double precision,
    "BiCchDepensier" double precision,
    "BiCchPci" double precision,
    "BiCchm2" double precision,
    "nbNivCha" double precision,
    "nbNivEcs" double precision,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "tauxCO2" double precision,
    "comAuditCha" text,
    "comAuditEcs" text,
    "idEtatEquipementCha" integer,
    "comEtatEquipementCha" text,
    "idEtatEquipementEcs" integer,
    "comEtatEquipementEcs" text,
    circulateurexterne boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieLnc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieLnc" (
    "idLnc" integer NOT NULL,
    "idSaisieLot" integer,
    nom character varying(150),
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idCor" integer,
    "keyCOR" character varying(5),
    "idDetailCor" integer,
    "keyDetail" character varying(5),
    "isCblPerdu" boolean,
    "idPositionVeranda" integer,
    "idMenuiserieVeranda" integer,
    "keyVitrageVeranda" character varying(10),
    "idVeranda" integer,
    "isLncIsoInconnu" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieLnc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieMasqueLointain; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieMasqueLointain" (
    "idMasque" integer NOT NULL,
    "idDetailEnveloppe" integer,
    nom character varying(255),
    alpha double precision,
    "isSud" boolean,
    "isHomogene" boolean,
    secteur character varying(50),
    "isMasqueFacade" boolean,
    "comAudit" text,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieMasqueLointain" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisiePhotovoltaique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisiePhotovoltaique" (
    "idDetailCpt" integer NOT NULL,
    "idDetailSourceEnergie" integer,
    "Surface" double precision,
    "Nm" double precision,
    "idInclPpv" integer,
    "pPv" double precision,
    "keyOri" character varying(5),
    k double precision,
    libelle character varying(255),
    "descriptifCapteur" text,
    "idResCapteur" uuid,
    "previewCapteur" bytea,
    "statutSaisie" integer NOT NULL,
    "prodCapteur" double precision,
    "isCapteurFacture" boolean,
    "isCollectif" boolean,
    "keySource" integer,
    "comAudit" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisiePhotovoltaique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisiePontThermique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisiePontThermique" (
    "idDetailPT" integer NOT NULL,
    "idPT" integer,
    "idP1" integer,
    "idP2" integer,
    longueur double precision,
    "Ksaisie" double precision,
    "keySource" integer,
    "K" double precision,
    "referenceAdm" character varying(255),
    "newRef" character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisiePontThermique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSaisieVeranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieVeranda" (
    "idDetailVeranda" integer NOT NULL,
    "idVeranda" integer,
    "descriptionFenetre" character varying(255),
    "idVitrage" integer,
    "isVir" boolean,
    "idMenuiserie" integer,
    "idParoiVitree" integer,
    b real,
    "isFondLoggia" boolean,
    "isAuvent" boolean,
    avancee real,
    "L1" real,
    "L2" real,
    "isLateral" boolean,
    "isRetourSud" boolean,
    "alphaHomogene" real,
    "isMhomogene" boolean,
    "isMnonHomogene" boolean,
    "idPosition" integer,
    "idInclinaison" integer,
    "isNu" integer,
    "idLp" integer,
    "hasRetourIso" boolean,
    "FtsSaisie" double precision,
    "avanceeLoggia" real,
    "alphaLE" real,
    "alphaCE" real,
    "alphaCO" real,
    "alphaLO" real,
    surface double precision,
    "statutSaisie" integer NOT NULL,
    "H" double precision,
    "L" double precision,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "idOrientationPAroi" integer,
    "Nbr" integer,
    "isRemplInconnu" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSaisieVeranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSourceEnergie" (
    "idDetailSourceEnergie" integer NOT NULL,
    "idSaisieLot" integer,
    "idDetailChauffage" integer,
    "presenceCapteurSolaire" boolean NOT NULL,
    "PpvSaisie" double precision,
    "Spv" double precision,
    "presenceEolienne" boolean NOT NULL,
    "PeoSaisie" double precision,
    "presencePuitCanadien" boolean NOT NULL,
    "presenceCogeneration" boolean NOT NULL,
    "PcoSaisie" double precision,
    "Pautre" double precision,
    "statutSaisie" integer NOT NULL,
    "isVendu" boolean,
    "idTypeEnergie" integer,
    "isEolVendu" boolean,
    "rachatEDFSolaire" double precision,
    "rachatEDFeolien" double precision,
    "isFactEole" boolean,
    "isFactCapteur" boolean,
    "idResSolaire" uuid,
    "previewSolaire" bytea,
    "idResEolienne" uuid,
    "previewEolienne" bytea,
    "descriptifCapteur" text,
    "descriptifEolienne" text,
    "presencePAC" boolean,
    "presenceCET" boolean,
    "presencePannThermique" boolean,
    "PresenceBois" boolean,
    "PresenceReseauVertueux" boolean,
    "PresenceGeothermie" boolean,
    entretien text,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "isCust1" boolean,
    cust1 character varying(255),
    cust2 character varying(255),
    cust3 text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailUsageRecense; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailUsageRecense" (
    "idDetailUsageRecense" integer NOT NULL,
    "idSaisieLot" integer,
    libelle character varying(150),
    "KEYusage" integer,
    "byUniteByEnergie" text,
    "efByEnergie" text,
    "ConsommationEP" double precision,
    "ConsommationPCI" double precision,
    "EmissionCO2" double precision,
    "Depense" double precision,
    "typeDetail" integer NOT NULL,
    "keyEnergie" character varying(10)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailUsageRecense" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdetailVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdetailVentilation" (
    "idDetailVentilation" integer NOT NULL,
    "idEnumereVentilation" integer,
    "idSaisieLot" integer,
    "idTypeVentilation" integer,
    "descriptionVentilation" character varying(255),
    "aRA" double precision,
    "isFenSansJoint" boolean,
    "isChemSansTrappe" boolean,
    "statutSaisie" integer NOT NULL,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    descriptif text,
    "hybInd" integer,
    "IsCabMultiple" boolean,
    "isSdbContinu" boolean,
    "isModule" boolean,
    "idDebitExtrait" integer,
    "nbSalleEau" integer,
    "descLong" character varying(500),
    "Q4paSaisi" double precision,
    "nbSalleEauavecWc" integer,
    "PventMoy" double precision,
    "CauxVent" double precision,
    "idProtection" integer,
    "anneeConstruction" integer,
    "PventSaisie" double precision,
    "keySource" integer,
    marque character varying(255),
    "Hperm" double precision,
    "Hvent" double precision,
    "Q4pa" double precision,
    n50 double precision,
    "Q4Paenv" double precision,
    "QvarepConv" double precision,
    "QvasoufConv" double precision,
    "SMEAconv" double precision,
    entretien text,
    e double precision,
    f double precision,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "isCust1" boolean,
    cust1 character varying(255),
    cust2 character varying(255),
    cust3 text,
    "comAudit" text,
    "idEtatEquipement" integer,
    "comEtatEquipement" text,
    "hasVmr" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdetailVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdonneesClimatiques; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdonneesClimatiques" (
    "idDC" integer NOT NULL,
    mois integer,
    "ZC" character varying(3),
    "Text0" real,
    "E0" real,
    "Nref19_0" real,
    "DH19_0" real,
    "DH14_0" real,
    "Tefs0" real,
    "Nref21_0" real,
    "DH21_0" real,
    "Nref26_0" real,
    "Nref28_0" real,
    "DH26_0" real,
    "DH28_0" real,
    "Eclim0" real,
    "Textmoyclim0" real,
    "Text400" real,
    "E400" real,
    "Nref19_400" real,
    "DH19_400" real,
    "DH14_400" real,
    "Tefs400" real,
    "Nref21_400" real,
    "DH21_400" real,
    "Nref26_400" real,
    "Nref28_400" real,
    "DH26_400" real,
    "DH28_400" real,
    "Eclim400" real,
    "Textmoyclim400" real,
    "Text800" real,
    "E800" real,
    "Nref19_800" real,
    "DH19_800" real,
    "DH14_800" real,
    "Tefs800" real,
    "Nref21_800" real,
    "DH21_800" real,
    "Nref26_800" real,
    "Nref28_800" real,
    "DH26_800" real,
    "DH28_800" real,
    "Eclim800" real,
    "Textmoyclim800" real,
    "TextMI" real,
    "EMi" real,
    "Nref19_Mi" real,
    "DH19_Mi" real,
    "DH14_Mi" real,
    "TefsMi" real,
    "Nref21_Mi" real,
    "DH21_Mi" real,
    "Nref26_Mi" real,
    "Nref28_Mi" real,
    "DH26_Mi" real,
    "DH28_Mi" real,
    "EclimMI" real,
    "TextmoyclimMI" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "TextMI_400" real,
    "EMi_400" real,
    "Nref19Mi_400" real,
    "DH19Mi_400" real,
    "DH14Mi_400" real,
    "TefsMi_400" real,
    "Nref21Mi_400" real,
    "DH21Mi_400" real,
    "Nref26Mi_400" real,
    "Nref28Mi_400" real,
    "DH26Mi_400" real,
    "DH28Mi_400" real,
    "EclimMI_400" real,
    "TextmoyclimMI_400" real,
    "TextMI_800" real,
    "EMi_800" real,
    "Nref19Mi_800" real,
    "DH19Mi_800" real,
    "DH14Mi_800" real,
    "TefsMi_800" real,
    "Nref21Mi_800" real,
    "DH21Mi_800" real,
    "Nref26Mi_800" real,
    "Nref28Mi_800" real,
    "DH26Mi_800" real,
    "DH28Mi_800" real,
    "EclimMI_800" real,
    "TextmoyclimMI_800" real,
    "Vvent" real,
    "NrefPv" real,
    "Epv" real,
    "C1_V_S" real,
    "C1_75_S" real,
    "C1_25_S" real,
    "C1_V_W" real,
    "C1_75_W" real,
    "C1_25_W" real,
    "C1_V_N" real,
    "C1_75_N" real,
    "C1_25_N" real,
    "C1_V_E" real,
    "C1_75_E" real,
    "C1_25_E" real,
    "C1_H" real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdonneesClimatiques" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdonneesClimatiquesAnnuelles; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdonneesClimatiquesAnnuelles" (
    "idData" integer NOT NULL,
    "Zone" character varying(10),
    "Fch" double precision,
    "MiFecsNeuf" double precision,
    "MiFecsAncien" double precision,
    "MiFecsEcsCh" double precision,
    "IcFecsAncien" double precision,
    "IcFecsNeuf" double precision,
    "TvFch" integer,
    "TvMiFecsNeuf" integer,
    "TvMiFecsAncien" integer,
    "TvMiFecsEcsCh" integer,
    "TvIcFecsAncien" integer,
    "TvIcFecsNeuf" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdonneesClimatiquesAnnuelles" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdossierDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdossierDPE" (
    "idMission" integer NOT NULL,
    "idTypeDossierDPE" character varying(5),
    "RELSYNDIC2_idDossierDPE" integer,
    "RELDTLIMM_idDossierDPE" integer,
    "RELDTLLOG_idDossierDPE" integer,
    "dateVisite" timestamp without time zone,
    "dateEtablissementDiagnostic" timestamp without time zone,
    "dateValidite" timestamp without time zone,
    "diagnostiqueurNom" character varying(50),
    "diagnostiqueurPrenom" character varying(50),
    "typeBatiment" character varying(50),
    "addresseBien" character varying(50),
    methode character varying(30),
    "versionMethode" character varying(50),
    "datePrixEnergies" timestamp without time zone,
    commentaire text,
    "idIntervenant" integer,
    "suiviDossierDPE" integer,
    "typeTransaction" integer,
    "isLocReleveDeConso" boolean,
    "locShBat" double precision,
    "locPeriodeReleveConsommation" character varying(100),
    "isLocEstimationALImmeuble" boolean NOT NULL,
    "isLocPourLogementRepresentatif" boolean NOT NULL,
    "locRatioLot" integer,
    "locRatioImmeuble" integer,
    "locIdDossierDpeParent" integer,
    "isNotIncludeDescriptifLot" boolean,
    "isGroupFactSansUsage" boolean NOT NULL,
    "partieBatERP" character varying(255),
    "typeGenerationDescLot" integer NOT NULL,
    "isGenererEtiquette" boolean NOT NULL,
    "isGenererTextEtiquette" boolean NOT NULL,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "isERP" boolean,
    "refADEME" character varying(255),
    "ChangeTime" timestamp without time zone,
    "isDPEplus" boolean,
    "commentaireMurs" text,
    "commentaireFermetures" text,
    "commentairePlafondPlancher" text,
    "commentaireInstalElec" text,
    "commentaireVentilation" text,
    "commentaireENR" text,
    "refTempADEME" character varying(255),
    "idGroupeRecommandation" integer,
    "refAdmAudit" character varying(255),
    "refAdmAuditPast" character varying(255),
    "isIncitatif" boolean,
    incitatif text,
    consentement integer,
    "infosContact" text,
    "adresseContact" text,
    "cpContact" character varying(50),
    "villeContact" character varying(255),
    "telContact" character varying(50),
    "isMprGeste" boolean,
    "isMpr" boolean,
    "isAide1" boolean,
    "isAide2" boolean,
    "isAide3" boolean,
    "isAide4" boolean,
    "isAide5" boolean,
    "genererConsentement" boolean,
    "contactMoral" boolean,
    "mailContact" character varying(255),
    "adresseComplementContact" text,
    "sirenContact" character varying(255),
    "optGen1" integer,
    "optGen2" integer,
    "optGen3" integer,
    "hasConsentement" boolean,
    "typeDemandeur" integer,
    "raisonDPE" integer,
    raison character varying(500),
    "showEtiquette" boolean,
    "idQRcode" uuid,
    "previewQRcode" bytea,
    "resTypeQRcode" character varying(50),
    "genererAuditCopro" boolean,
    option1 integer,
    option2 integer,
    option3 integer,
    "isAuditCopro" boolean,
    "refAdemeXml" character varying(255),
    "statutAdemeXml" character varying(50),
    "idStatutAdemeXml" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdossierDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEdptClimat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEdptClimat" (
    dpt character varying(2) NOT NULL,
    "idZoneHiver" character varying(2),
    "idZoneEte" character varying(2),
    "libelleDpt" character varying(50) NOT NULL,
    "altMin" integer NOT NULL,
    "altMax" integer NOT NULL,
    "Nref" integer NOT NULL,
    "Dhref" integer NOT NULL,
    "Pref" integer NOT NULL,
    "C3" double precision,
    "C4" integer,
    "tExtDeBase" real NOT NULL,
    "E" double precision NOT NULL,
    "Fch" double precision NOT NULL,
    "FecsAncienneMI" real NOT NULL,
    "FecsRecenteMI" real NOT NULL,
    "FecsSolaireMI" real NOT NULL,
    "FecsAncienneIC" real NOT NULL,
    "FecsRecenteIC" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "ZC" character varying(3) NOT NULL,
    "Tbase0" double precision NOT NULL,
    "Tbase400" double precision NOT NULL,
    "Tbase800" double precision NOT NULL,
    "MiFch" double precision NOT NULL,
    "MiFecsAncien" double precision NOT NULL,
    "MiFecsRecent" double precision NOT NULL,
    "MiFchFecs" double precision NOT NULL,
    "IcFecsAncien" double precision NOT NULL,
    "IcFecsRecent" double precision NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEdptClimat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonAppartement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonAppartement" (
    "idEchantillon" integer NOT NULL,
    "idSaisieLot" integer,
    libelle character varying(255),
    descriptif text,
    "idEnumereConfigurationAppartement" integer,
    "Surface" double precision,
    "Typologie" character varying(255),
    "TypePh" character varying(255),
    "TypePb" character varying(255),
    "Etage" character varying(255),
    "coeffIFC" double precision,
    "referenceAdm" character varying(255),
    "newRef" character varying(255),
    "isVisite" boolean,
    cust1 character varying(255),
    cust2 character varying(255),
    cust3 text,
    "comAudit" text,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonAppartement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonClimatisation" (
    "idEchantillon" integer,
    "idDetailClimatisation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonFenetre" (
    "idEchantillon" integer,
    "idDetailEnveloppe" integer,
    "Nb" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonGenerateur" (
    "idEchantillon" integer,
    "idSaisieGenerateur" integer,
    type integer,
    "Pn" double precision,
    "Vs" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonMur" (
    "idEchantillon" integer,
    "idDetailEnveloppe" integer,
    "Surface" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPlafond" (
    "idEchantillon" integer,
    "idDetailEnveloppe" integer,
    "Surface" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPlancher" (
    "idEchantillon" integer,
    "idDetailEnveloppe" integer,
    "Surface" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEechantillonPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPorte" (
    "idEchantillon" integer,
    "idDetailEnveloppe" integer,
    "Surface" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEechantillonPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEeligibiliteParcours; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEeligibiliteParcours" (
    "idEligibiliteParcours" integer NOT NULL,
    "idParcoursDossier" integer,
    libelle text,
    "isEligible" integer,
    info text,
    c1 double precision,
    c2 double precision,
    c3 double precision,
    "isIn" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEeligibiliteParcours" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumConfigurationAppartement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumConfigurationAppartement" (
    "idEnumereConfigurationAppartement" integer NOT NULL,
    "descriptionCourteConfigurationAppartement" character varying(100) NOT NULL,
    "libelleConfigurationAppartement" character varying(255) NOT NULL,
    "deperditionPlancherHaut" boolean NOT NULL,
    "deperditionPlancherHautPartiel" boolean NOT NULL,
    "localNonChauffeHaut" boolean NOT NULL,
    "deperditionPlancherBas" boolean NOT NULL,
    "deperditionPlancherBasPartiel" boolean NOT NULL,
    "localNonChauffeBas" boolean NOT NULL,
    "isEtageIntermediaire" boolean NOT NULL,
    "coeffScombles" double precision NOT NULL,
    "coeffSterrasse" double precision NOT NULL,
    "coeffSsol" double precision NOT NULL,
    lpbeme double precision NOT NULL,
    lpbime double precision NOT NULL,
    ltpme double precision NOT NULL,
    lpibme double precision NOT NULL,
    lpihme double precision NOT NULL,
    ltteme double precision NOT NULL,
    lttime double precision NOT NULL,
    ltcme double precision NOT NULL,
    lrfme double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumConfigurationAppartement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereAideAudit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAideAudit" (
    "idAide" integer NOT NULL,
    titre character varying(255),
    "ssTitre" character varying(255),
    detail text,
    "coutMin" double precision,
    "coutMax" double precision,
    "coutMoy" double precision,
    "isCoutMoy" boolean,
    "typeCout" character varying(15),
    montant double precision,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "idRes" uuid,
    "resData" bytea,
    "resType" character varying(50),
    "isSuppr" boolean,
    lnk text,
    ordre integer,
    "pInter" double precision,
    "isPinter" boolean,
    "guidAide" character varying(50),
    "isParcoursAide" boolean,
    "isEligibleMan" integer,
    "isCompatibleMpr" boolean,
    cout double precision,
    "isCee" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAideAudit" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereAideREcommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAideREcommandation" (
    "idEnumereAide" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    titre character varying(255),
    "ssTitre" character varying(255),
    detail text,
    "coutMin" double precision,
    "coutMax" double precision,
    "coutMoy" double precision,
    "isCoutMoy" boolean,
    "typeCout" character varying(15),
    montant double precision,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "idRes" uuid,
    lnk text,
    ordre integer,
    "pInter" double precision,
    "isPinter" boolean,
    "guidAide" character varying(50),
    "isEligibleMan" integer,
    "isCee" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAideREcommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereAncienneteEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAncienneteEmetteur" (
    "idAncEmet" integer NOT NULL,
    anicennete character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAncienneteEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereAncienneteGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAncienneteGenerateur" (
    "idAnciennete" integer NOT NULL,
    libelle character varying(100),
    "notRecommandable" boolean,
    min integer,
    max integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyMoteur" character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAncienneteGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereAnneeConstruction; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAnneeConstruction" (
    "idEnumereAnneeConstruction" integer NOT NULL,
    "libelleAnneeConstruction" character varying(30) NOT NULL,
    "anDepart" integer NOT NULL,
    "anFin" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    tv1 integer,
    tv2 integer,
    tv3 integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereAnneeConstruction" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereApplicationRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereApplicationRecommandation" (
    "idEnumereApplicationRecommandation" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    "libelleRecommandation" text,
    "tarifMin" double precision,
    "tarifMax" double precision,
    "isTarifForfaitaire" boolean,
    "pourcentageCreditImpot" double precision,
    "isApplicableMaisonAncienne" boolean,
    "libelleRecommandationCourt" character varying(255),
    "isAutoApplicable" boolean,
    "isMI" boolean,
    "isIC" boolean,
    "R" double precision,
    "U" double precision,
    "idDonneSur" integer,
    "isITI" boolean,
    "isITE" boolean,
    "isITR" boolean,
    "epaisseurIso" double precision,
    "isRetourIso" boolean,
    "idEnumereUporte" integer,
    "porteIsolee" boolean,
    "porteSas" boolean,
    "isLourd" boolean,
    "idVentil" integer,
    "VentilJoint" boolean,
    "VentilTrappe" boolean,
    "idMenuiserieFilter" integer,
    "idVitrageFilter" integer,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "isDbleFenetre" boolean,
    "idVitrage" integer,
    "isVir" boolean,
    "isKrypton" boolean,
    "idUg" integer,
    "idMenuiserie" integer,
    "idParoiVitree" integer,
    "idFermeture" integer,
    "isNu" integer,
    "idLp" integer,
    "Ksaisie" double precision,
    "UsaisieContainsR" boolean,
    "hasRegulParPiece" boolean,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idGroupeRecommandation" integer,
    "typeCredit" integer,
    "Contrainte" character varying(255),
    "PerfRecommandee" character varying(255),
    "keyBouquet" character varying(10),
    "Ujn" double precision,
    "jointFenetre" boolean,
    "jointPorte" boolean,
    "porteIsoDbleV" boolean,
    "categorieAu" character varying(255),
    "sousCategorieAu" character varying(255),
    "keyCategorieAu" character varying(10),
    "tarifMoy" double precision,
    "isTarifMoy" boolean,
    "dureeMin" double precision,
    "dureeMax" double precision,
    "dureeMoy" double precision,
    "isDureeMoy" double precision,
    "typeDureeMoy" character varying(15),
    "isForfaitDuree" boolean,
    "totAideMin" double precision,
    "totAideMax" double precision,
    "totAideMoy" double precision,
    "isAideMoy" boolean,
    "typeAide" character varying(15),
    "lexLibre" text,
    "lexFixe" text,
    "isLexModifiable" boolean,
    "titreLex" character varying(255),
    "vitrageTous" boolean,
    "vitrageSimple" boolean,
    "vitrageDouble" boolean,
    "vitrageSurvitrage" boolean,
    "vitrageBrique" boolean,
    "vitragePoly" boolean,
    "menuiserieTous" boolean,
    "menuiserieRupture" boolean,
    "menuiserieSansRupture" boolean,
    "menuiseriePvc" boolean,
    "menuiserieBois" boolean,
    "menuiserieBoisMetal" boolean,
    collectif boolean,
    individuel boolean,
    "anneeInstall" integer,
    "energieTous" boolean,
    "energieElec" boolean,
    "energieGaz" boolean,
    "energieFioul" boolean,
    "energieBois" boolean,
    "energieGpl" boolean,
    "energieCharbon" boolean,
    "energieReseau" boolean,
    "chaudiereSt" boolean,
    "ChaudiereCl" boolean,
    "ChaudiereBt" boolean,
    "ChaudiereCond" boolean,
    pac boolean,
    poele boolean,
    "radGaz" boolean,
    "airChaud" boolean,
    bijonction boolean,
    "systemeTous" boolean,
    "chauffeEauThermo" boolean,
    "accuGaz" boolean,
    "ballonElec" boolean,
    "ventilTous" boolean,
    "ventilDivers" boolean,
    "ventilSF" boolean,
    "ventilDF" boolean,
    "ventilHygro" boolean,
    "ventilHybrid" boolean,
    "ventilPuit" boolean,
    "idModele" integer,
    "isModele" boolean,
    "isRemplaceInstall" boolean,
    "isRemplaceGene" boolean,
    c1 boolean,
    c2 boolean,
    c3 boolean,
    c4 boolean,
    c5 boolean,
    c6 boolean,
    "Sw" double precision,
    "poseDbleUnique" boolean,
    "hasDerog" integer,
    derog text,
    "Pn" double precision,
    "Rpn" double precision,
    "Rpint" double precision,
    "Pveil" double precision,
    "hasVeil" boolean,
    "idSysClim" integer,
    "idNrjClim" integer,
    "idResUrbClim" integer,
    "isCollectifClim" boolean,
    "isSeerConnu" boolean,
    "Seer" double precision,
    "Pcirc" double precision,
    "cAutoLnc" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereApplicationRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereB; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereB" (
    "idB" integer NOT NULL,
    "Rsmin" real,
    "Rsmax" real,
    "Uvue" real,
    islnciso boolean,
    isliso boolean,
    b real,
    "tvWB" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLibIsoLnc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereB" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieFermeture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieFermeture" (
    "idFermeture" integer NOT NULL,
    libelle character varying(255),
    "dR" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieFermeture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieMenuiserie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieMenuiserie" (
    "idMenuiserie" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "Tsmpl" double precision,
    "Tdble" double precision,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieMenuiserie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieParoiVitree; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieParoiVitree" (
    "idParoiVitree" integer NOT NULL,
    "idMenuiserie" integer,
    libelle character varying(255),
    "isFenetre" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isVeranda" boolean,
    "libVeranda" character varying(50),
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieParoiVitree" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieT" (
    "idEnumereT" integer NOT NULL,
    "idMenuiserie" integer,
    "idVitrage" integer,
    "T" double precision,
    "Tvir" double precision,
    "Tv" integer,
    "TvVir" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieUg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUg" (
    idug integer NOT NULL,
    "idVitrage" integer,
    epaisseur real,
    "UgVnt" double precision,
    "UgVir" double precision,
    "UgVntKrypton" double precision,
    "UgVirKrypton" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieUjn; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUjn" (
    "idUjn" integer NOT NULL,
    "idFermeture" integer,
    "Uw" double precision,
    "Ujn" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUjn" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieUw; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUw" (
    "idUw" integer NOT NULL,
    "idParoiVitree" integer,
    "Ug" double precision,
    "Uw" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieUw" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieVitrage" (
    "idVitrage" integer NOT NULL,
    libelle character varying(50),
    "Ug" double precision,
    "Uw" double precision,
    "Fts" double precision,
    "keyVitrage" character varying(50),
    "tvWB" character varying(10),
    "tvWB_W" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "isVeranda" boolean,
    "libVeranda" character varying(50),
    "idLib" integer,
    "idLibMen" integer,
    "isVertical" boolean,
    "isHorizontal" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBaieW; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieW" (
    idw integer NOT NULL,
    "idParoiVitree" integer,
    "keyVitrage" character varying(50),
    "isVir" boolean,
    "isNu" boolean,
    "W" double precision,
    "tvWB_W" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBaieW" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereBveranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBveranda" (
    "idBver" integer NOT NULL,
    "ZC" character varying(5),
    "keyCor" character varying(5),
    "isIso" boolean,
    b real,
    "Tv" integer,
    "idLibIsoLnc" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereBveranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCOP; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCOP" (
    "idCop" integer NOT NULL,
    "idGenerateur" integer,
    "idAnciennete" integer,
    "copEcsH1H2ambiant" double precision,
    "copEcsH1H2extrait" double precision,
    "copEcsH1H2pac" double precision,
    "copH3ambiant" double precision,
    "copH3extrait" double precision,
    "copH3pac" double precision,
    "isEcs" boolean,
    "isChauffage" boolean,
    "isPacAirAir" boolean,
    "copChaH1H2Autre" double precision,
    "copChaH1H2Plancher" double precision,
    "copChaH3Autre" double precision,
    "copChaH3plancher" double precision,
    "isPacAirEAu" boolean,
    "hasAtita" boolean,
    "idLibEcsExterieur" integer,
    "idLibEcsAmbiant" integer,
    "idLibEcsExtrait" integer,
    "idLibChauffage" integer,
    "idCopEcsH1H2ambiant" integer,
    "idCopEcsH3ambiant" integer,
    "idCopEcsH1H2extrait" integer,
    "idCopEcsH3extrait" integer,
    "idCopChH1H2Autre" integer,
    "idCopChH3Autre" integer,
    "idCopChH1H2Ph" integer,
    "idCopChH3Ph" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCOP" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCORPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORPlafond" (
    "idEnumerCORPlafond" integer NOT NULL,
    "keyCORPlafond" character varying(5) NOT NULL,
    "typePlafond" character varying(50) NOT NULL,
    "CORplafond" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCORmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORmur" (
    "idEnumereCORmur" integer NOT NULL,
    "keyCORmur" character varying(5) NOT NULL,
    "libelleCORmur" character varying(50) NOT NULL,
    "CORmur" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCORsol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORsol" (
    "idEnumereCORsol" integer NOT NULL,
    "keyCORsol" character varying(5) NOT NULL,
    "typeSol" character varying(50) NOT NULL,
    "CORsol" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCORsol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCaracteristiqueGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCaracteristiqueGenerateur" (
    "idCarac" integer NOT NULL,
    "idGenerateur" integer,
    "idAnciennete" integer,
    "COP" double precision,
    "Rg" double precision,
    "Pn" double precision,
    "Rpn" double precision,
    "Rpn1" double precision,
    "Rpint" double precision,
    "Rpint2" double precision,
    "A" double precision,
    "Aint" double precision,
    "B" double precision,
    "Bint" double precision,
    "Qp0" double precision,
    "dQp0" double precision,
    "expQp0" double precision,
    "Pveil" double precision,
    "hasAtita" boolean,
    "hasVentilo" boolean,
    "tvWB" character varying(10),
    "tvWB_bis" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "E" double precision,
    "F" double precision,
    "Alim1" double precision,
    "Aintlim1" double precision,
    "Blim1" double precision,
    "Bitlim1" double precision,
    "Alim2" double precision,
    "Aintlim2" double precision,
    "Blim2" double precision,
    "Bintlim2" double precision,
    "dQp0lim1" double precision,
    "expQp0lim1" double precision,
    "dQp0lim2" double precision,
    "expQp0lim2" double precision,
    "Alim3" double precision,
    "Aintlim3" double precision,
    "Blim3" double precision,
    "Bintlim3" double precision,
    "dQp0lim3" double precision,
    "expQp0lim3" double precision,
    "keyMoteur" character varying(50),
    "Alim4" double precision,
    "Aintlim4" double precision,
    "Blim4" double precision,
    "Bintlim4" double precision,
    "dQp0lim4" double precision,
    "expQp0lim4" double precision,
    "idLibEcs" integer,
    "idLibEcs1" integer,
    "idLibCha1" integer,
    "idLibCha2" integer,
    "idLibCha3" integer,
    "idLibCha4" integer,
    tv1 integer,
    tv2 integer,
    tv3 integer,
    tv4 integer,
    "tvRg" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCaracteristiqueGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCef; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCef" (
    "idCef" integer NOT NULL,
    libelle character varying(50),
    "Cef" double precision,
    "Cefhors" double precision,
    "tvWB" character varying(10),
    "tvWB_Hors" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCef" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCoeffPcirc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCoeffPcirc" (
    "idPcirc" integer NOT NULL,
    lib character varying(50),
    "G" double precision,
    "H" double precision,
    "isChaudiereBois" boolean,
    "isChaudiereGaz" boolean,
    "isAirChaudAvecV" boolean,
    "isAirChaudSansV" boolean,
    "isTubeRadiant" boolean,
    "isRadiateurGaz" boolean,
    "isChauffeEauGaz" boolean,
    "isAccuGaz" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCoeffPcirc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCommentaireDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCommentaireDossier" (
    "idEnumereCommentaireDossier" integer NOT NULL,
    "libelleCommentaire" character varying(100) NOT NULL,
    commentaire text NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCommentaireDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCommentairePreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCommentairePreconisation" (
    "idEnumereCommentairePreconisation" integer NOT NULL,
    "libelleCommentaire" character varying(255),
    commentaire text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCommentairePreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereConduiteReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConduiteReseau" (
    "idConduite" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConduiteReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereConseilAudit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConseilAudit" (
    "idConseil" integer NOT NULL,
    libelle character varying(255),
    conseil text,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "coutMin" double precision,
    "coutMax" double precision,
    cout double precision,
    "pInter" double precision,
    c1 double precision,
    c2 double precision,
    bc3 boolean,
    tc4 text,
    "isInclusAide" integer,
    "isEligibleMprPa" integer,
    "isEligibleMprCopro" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConseilAudit" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereConseilRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConseilRecommandation" (
    "idEnumereConseil" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    libelle character varying(255),
    conseil text,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "coutMin" double precision,
    "coutMax" double precision,
    cout double precision,
    ordre integer,
    "pInter" double precision,
    c1 double precision,
    c2 double precision,
    bc3 boolean,
    tc4 text,
    "isInclusAide" integer,
    "isEligibleMprPa" integer,
    "isEligibleMprCopro" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereConseilRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCorBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCorBaie" (
    "idEnumereCorBaie" integer NOT NULL,
    "keyCORbaie" character varying(5) NOT NULL,
    "libelleCORbaie" character varying(50),
    "CORbaie" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCorBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCr" (
    "idCr" integer NOT NULL,
    "idGenerateur" integer,
    "minVs" real,
    "maxVs" real,
    "Cr" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyCategorie" character varying(10),
    tv integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereCreditImpot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCreditImpot" (
    "idEnumereCreditImpot" integer NOT NULL,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "valeurCredit" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "typeCredit" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereCreditImpot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDebitExtrait; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDebitExtrait" (
    "idDebitExtrait" integer NOT NULL,
    "nbPiece" character varying(50),
    cuisine double precision,
    sdb double precision,
    "salleEau" double precision,
    "wcUnique" double precision,
    "wcMultiple" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDebitExtrait" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailCORPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORPlafond" (
    "idEnumerDetailCORPlafond" integer NOT NULL,
    "idEnumereCORPlafond" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailCORmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORmur" (
    "idEnumereDetailCORmur" integer NOT NULL,
    "idEnumereCORmur" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idLin" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailCORsol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORsol" (
    "idEnumerDetailCORsol" integer NOT NULL,
    "idEnumereCORsol" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCORsol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailCorBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCorBaie" (
    "idEnumereDetailCORbaie" integer NOT NULL,
    "idEnumereCorBaie" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailCorBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailParcoursAide; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailParcoursAide" (
    "idEnumereDetailParcoursAide" integer NOT NULL,
    "idEnumereParcoursAide" integer,
    "Libelle" text,
    "typeRevenu" integer,
    "montantRTM" double precision,
    "montantRM" double precision,
    "montantRI" double precision,
    "montantRS" double precision,
    "PafondMontant" double precision,
    "PlafondElligibilite" double precision,
    "keyType" integer,
    "typeOperateur" integer,
    "typeUnite" integer,
    data1 integer,
    "Operateur1" integer,
    "Valeur1" double precision,
    data2 integer,
    "Operateur2" integer,
    "Valeur2" double precision,
    data3 integer,
    "Operateur3" integer,
    "Valeur3" double precision,
    data4 integer,
    "Operateur4" integer,
    "Valeur4" double precision,
    data5 integer,
    "Operateur5" integer,
    "Valeur5" double precision,
    data6 integer,
    "Operateur6" integer,
    "Valeur6" double precision,
    "isCalculable" integer,
    "repOui" text,
    "repNon" text,
    "guidDetail" character varying(50),
    "isObligatoire" integer,
    "idExigence" integer,
    "ExigenceInfo" text,
    "isEligibleMan" integer,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "typeCalcul" integer,
    data7 integer,
    "Operateur7" integer,
    "Valeur7" double precision,
    data8 integer,
    "Operateur8" integer,
    "Valeur8" double precision,
    data9 integer,
    "Operateur9" integer,
    "Valeur9" double precision,
    data10 integer,
    "Operateur10" integer,
    "Valeur10" double precision,
    "lstGenerateurs" character varying(500),
    "isDerogable" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailParcoursAide" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailUmurD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUmurD" (
    "idDetail" integer NOT NULL,
    "idEnumereUmurD" integer,
    "minAn" integer,
    "supAn" integer,
    "UmurD" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUmurD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailUplafondD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUplafondD" (
    "idDetail" integer NOT NULL,
    "idEnumereUplafondD" integer,
    "minAn" integer,
    "supAn" integer,
    "UplafondD" double precision,
    "UplafondDCombleHabites" double precision,
    "UplafondDTerrasse" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUplafondD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDetailUplancherD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUplancherD" (
    "idDetail" integer NOT NULL,
    "idEnumereUplancherD" integer,
    "minAn" integer,
    "supAn" integer,
    "UplancherD" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDetailUplancherD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDhd; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDhd" (
    "idDhd" integer NOT NULL,
    "idZoneHiver" character varying(2),
    "N" real,
    "Tmoy" real,
    "Tmin" real,
    "dX" real,
    "DH14" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDhd" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereDistribReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDistribReseau" (
    "idDistrib" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereDistribReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEconomies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEconomies" (
    "idEnumereEconomies" integer NOT NULL,
    "libelleEconomies" character varying(30) NOT NULL,
    "valeurEconomies" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEconomies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEffortInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEffortInvestissement" (
    "idEnumereEffortInvestissement" integer NOT NULL,
    "libelleEffortInvestissement" character varying(30) NOT NULL,
    "valeurEffortInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEffortInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEmetteur" (
    "idEnumereEmetteur" integer NOT NULL,
    "idTypeEnergie" integer,
    "KEY_emetteur" character varying(10),
    "libelleEmetteur" character varying(150) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEmetteurIntermittence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEmetteurIntermittence" (
    "idEmet" integer NOT NULL,
    "idTypeChauffage" integer,
    libelle character varying(50),
    "isMI" boolean,
    "isICindividuel" boolean,
    "isICcollectif" boolean,
    "AvecRegul" boolean,
    "Central" boolean,
    "Divise" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEmetteurIntermittence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEpaisseurIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEpaisseurIsolant" (
    "idEnumereEpaisseurIsolant" integer NOT NULL,
    "epaisseurIsolant" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEpaisseurIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEquipementIntermittence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEquipementIntermittence" (
    "idInter" integer NOT NULL,
    libelle character varying(100),
    "isMi" boolean,
    "isICindividuel" boolean,
    "isICcollectif" boolean,
    "parPiece" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    detecteur boolean,
    "xDpe" integer NOT NULL,
    "isCentral" boolean,
    "isMinT" integer,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEquipementIntermittence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereEtage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEtage" (
    "idEnumereEtage" integer NOT NULL,
    "libelleEtage" character varying(20) NOT NULL,
    "valeurEtage" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereEtage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereFe1; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFe1" (
    "idFe1" integer NOT NULL,
    "isFondLoggia" boolean,
    "isAuvent" boolean,
    "isLateral" boolean,
    "isRetourSud" boolean,
    "minAvancee" real,
    "maxAvancee" real,
    "minL1L2" real,
    "maxL1L2" real,
    "keyOrientation" character varying(10),
    "Fe1" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFe1" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereFe2; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFe2" (
    "idFe2" integer NOT NULL,
    "minAlpha" real,
    "maxAlpha" real,
    "keyOrientation" character varying(10),
    "Fe2" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFe2" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereFicheTechnique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFicheTechnique" (
    "idEnumeFt" integer NOT NULL,
    categorie character varying(50),
    entree character varying(255),
    "ordreCat" smallint,
    ordre smallint,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keySource" integer,
    "xDpe" integer,
    "comDefaut" text,
    disc character varying(50),
    "isIn" boolean,
    "valInt" integer,
    "valDble" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereFicheTechnique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereGenerateur" (
    "idGenerateur" integer NOT NULL,
    "idTypeEnergie" integer,
    libelle character varying(100),
    "Rg" double precision,
    "Rr" double precision,
    "RrRegTermi" double precision,
    "RrRobinetThermo" double precision,
    "Rs" double precision,
    "isEffetJoule" boolean,
    "hasEmetteur" boolean,
    "isIndividuel" boolean,
    "isMi" boolean,
    "isIC" boolean,
    "notApart" boolean,
    "isDivise" boolean,
    "idTypeEmetteur" integer,
    "isECS" boolean,
    "isChauffage" boolean,
    "isChaudiere" boolean,
    "isChaudiereBT" boolean,
    "isChaudiereC" boolean,
    "isChaudiereSt" boolean,
    "isPAC" boolean,
    "isInsert" boolean,
    "isRadiateurGaz" boolean,
    "isAirChaud" boolean,
    "isBijonction" boolean,
    "isPoelBois" boolean,
    "isAcuGaz" boolean,
    "isChauffeBain" boolean,
    "isChauffeEauThermo" boolean,
    "isBallonElec" boolean,
    "COPextrait" double precision,
    "COPexterieur" double precision,
    "keyRd" character varying(5),
    "notRecommandable" boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "isGranule" boolean,
    "isHybrid" boolean,
    "keyMoteur" character varying(10),
    "isMultiBat" boolean,
    "tvRg" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereGroupeRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereGroupeRecommandation" (
    "idGroupeRecommandation" integer NOT NULL,
    "LibelleGroupe" character varying(255),
    "EffortInvestMaxPlage1" integer,
    "EffortInvestMaxPlage2" integer,
    "EffortInvestMaxPlage3" integer,
    "EffortInvestMaxPlage4" integer,
    "EffortInvestMaxPlage5" integer,
    "PictogrammeEffortInvest" bytea,
    "EconomiesMaxPlage1" integer,
    "EconomiesMaxPlage2" integer,
    "EconomiesMaxPlage3" integer,
    "EconomiesMaxPlage4" integer,
    "EconomiesMaxPlage5" integer,
    "PictogrammeEconomies" bytea,
    "RetourInvestMaxPlage1" integer,
    "RetourInvestMaxPlage2" integer,
    "RetourInvestMaxPlage3" integer,
    "RetourInvestMaxPlage4" integer,
    "RetourInvestMaxPlage5" integer,
    "PictogrammeRetourInvest" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereGroupeRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereI0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereI0" (
    "idIzero" integer NOT NULL,
    "idInter" integer,
    "keyEmet" character varying(5),
    intertie character varying(50),
    "isCentral" boolean,
    "isDivise" boolean,
    "hasComptage" boolean,
    "hasRegul" boolean,
    "I0" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    detecteur boolean,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereI0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereIauxClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereIauxClimatisation" (
    "idEnumereIauxClimatisation" integer NOT NULL,
    "libelleClim" character varying(50),
    "C" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereIauxClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereId; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereId" (
    "idEnumereId" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    id integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereId" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInclinaisonC1; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonC1" (
    "idC" integer NOT NULL,
    "idInclinaison" integer,
    "keyOrientation" character varying(10),
    "C1" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonC1" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInclinaisonCapteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonCapteur" (
    "idInclPpv" integer NOT NULL,
    "Inclinaison" character varying(50),
    "idLib" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonCapteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInclinaisonParoi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonParoi" (
    "idInclinaison" integer NOT NULL,
    inclinaison character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "Xdpe" integer NOT NULL,
    "idLib" integer,
    "isVertical" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInclinaisonParoi" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInertie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInertie" (
    "idInertie" integer NOT NULL,
    "PbLourd" boolean,
    "PhLourd" boolean,
    "PvLourd" boolean,
    "keyInertie" character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInertie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInfoAudit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInfoAudit" (
    "idInfo" integer NOT NULL,
    libelle character varying(255),
    info text,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "idType" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInfoAudit" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInfoRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInfoRecommandation" (
    "idEnumereInfos" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    libelle character varying(255),
    info text,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "keyAmeliorer" character varying(10),
    "idType" integer,
    ordre integer,
    "pInter" double precision,
    c1 double precision,
    c2 double precision,
    c3 double precision,
    bc3 boolean,
    tc4 text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInfoRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereInstalltionChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInstalltionChauffage" (
    "idInstallation" integer NOT NULL,
    type character varying(255),
    "isMi" boolean,
    "isIC" boolean,
    "keyInstall" integer,
    "tvWB" character varying(10),
    "infoInstall" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereInstalltionChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereIsolant" (
    "idEnumereIsolant" integer NOT NULL,
    "libelleIsolant" character varying(50) NOT NULL,
    classe character varying(15) NOT NULL,
    lambda real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereKphotovoltaique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereKphotovoltaique" (
    "idK" integer NOT NULL,
    "keyOri" character varying(5),
    "idInclPpv" integer,
    k double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereKphotovoltaique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereLameAir; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLameAir" (
    "idEnumereLameAir" integer NOT NULL,
    "libelleLameAir" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLameAir" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereLargeurDormant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLargeurDormant" (
    "idLp" integer NOT NULL,
    lp real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLargeurDormant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereLexiqueAudit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLexiqueAudit" (
    "idLex" integer NOT NULL,
    titre character varying(255),
    "lexLibre" text,
    "lexFixe" text,
    "isLexFixe" boolean,
    "keyAmeliorer" character varying(10),
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    cust1 boolean,
    cust2 double precision,
    cust3 character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLexiqueAudit" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereLineaireFenetreMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLineaireFenetreMur" (
    "idLineaire" integer NOT NULL,
    "keyLineique" character varying(50),
    "MurNonIso" boolean,
    "MurIti" boolean,
    "MurIte" boolean,
    "isRetourIso" boolean,
    "MurItr" boolean,
    "MurItiIte" boolean,
    "MurItiItr" boolean,
    "MurIteItr" boolean,
    "isNu" integer,
    "idLp" integer,
    k double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLineaireFenetreMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereLineaireGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLineaireGeneral" (
    "idLineaire" integer NOT NULL,
    "keyLineique" character varying(50),
    "P1nonIso" boolean,
    "P1iti" boolean,
    "P1ite" boolean,
    "P1itr" boolean,
    "P1itiite" boolean,
    "P1itiitr" boolean,
    "P1iteitr" boolean,
    "P2nonIso" boolean,
    "P2iti" boolean,
    "P2ite" boolean,
    "P2itiite" boolean,
    k double precision,
    "isTerrasse" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereLineaireGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereMIT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereMIT" (
    "idEnumereMIT" integer NOT NULL,
    "descriptionMIT" character varying(50) NOT NULL,
    "MIT" double precision NOT NULL,
    "MIT2a" double precision NOT NULL,
    "MIT2b" double precision NOT NULL,
    "MIT2c" double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereMIT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereOmb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereOmb" (
    "idOmb" integer NOT NULL,
    "keyOrientation" character varying(10),
    "minAlpha" real,
    "maxAlpha" real,
    "secteurLateral" boolean,
    "secteurCentral" boolean,
    "isSud" boolean,
    "Omb" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereOmb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereParamEchantillon; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParamEchantillon" (
    "idEnumereParamEch" integer NOT NULL,
    "keyParam" character varying(5),
    libelle character varying(255),
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParamEchantillon" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereParcoursAide; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParcoursAide" (
    "idEnumereParcoursAide" integer NOT NULL,
    "guidAide" character varying(50),
    "typeCalcul" integer,
    "plafondMontant" double precision,
    "plafondEligibilite" double precision,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    plafond2cl double precision,
    plafond3cl double precision,
    plafond4cl double precision,
    "plafondPlus" double precision,
    "tauxMtr2cl" double precision,
    "tauxMtr3cl" double precision,
    "tauxMtr4cl" double precision,
    "tauxMtrPlus" double precision,
    "tauxMr2cl" double precision,
    "tauxMr3cl" double precision,
    "tauxMr4cl" double precision,
    "tauxMrPlus" double precision,
    "tauxMi2cl" double precision,
    "tauxMi3cl" double precision,
    "tauxMi4cl" double precision,
    "tauxMiPlus" double precision,
    "tauxMs2cl" double precision,
    "tauxMs3cl" double precision,
    "tauxMs4cl" double precision,
    "tauxMsPlus" double precision,
    "bonifMtr" double precision,
    "bonifMr" double precision,
    "bonifMi" double precision,
    "bonifMs" double precision,
    "ecretementMtr" double precision,
    "ecretementMr" double precision,
    "ecretementMi" double precision,
    "ecretementMs" double precision,
    "plafondPtz" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParcoursAide" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereParcoursFiscal; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParcoursFiscal" (
    "idEnumereRf" integer NOT NULL,
    "nbPErsonne" integer,
    "isParis" boolean,
    mtr double precision,
    mr double precision,
    mi double precision,
    ms double precision,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereParcoursFiscal" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePerteRecup; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePerteRecup" (
    "idPerte" integer NOT NULL,
    zone character varying(5),
    "isCollectif" boolean,
    "isInstantane" boolean,
    "keySyst" character varying(5),
    "Pr" double precision,
    "Prs" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePerteRecup" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePlageAltitude; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePlageAltitude" (
    "idEnumerePlageAltitude" integer NOT NULL,
    "libelleClasse" character varying(15) NOT NULL,
    "valeurClasse" integer NOT NULL,
    "minAltitude" integer,
    "maxAltitude" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePlageAltitude" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePnIndividuel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePnIndividuel" (
    "idPn" integer NOT NULL,
    "PdimMin" real,
    "PdimMax" real,
    "PnAvt2006" double precision,
    "PnApr2006" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePnIndividuel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePositionBaieLoggia; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePositionBaieLoggia" (
    "idPosition" integer NOT NULL,
    "position" character varying(50),
    f real,
    "isFond" boolean,
    "keyOrientation" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePositionBaieLoggia" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePositionOrientationParoi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePositionOrientationParoi" (
    "idPosition" integer NOT NULL,
    "position" character varying(50),
    "keyOrientation" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePositionOrientationParoi" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumerePr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePr" (
    "idPrs" integer NOT NULL,
    "isECS" boolean,
    "isInd" boolean,
    "isChauffeBain" boolean,
    "isChaudiereMixte" boolean,
    "hasBallonIn" boolean,
    "PrH1" double precision,
    "PrH2" double precision,
    "PrH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumerePr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereProtectionVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereProtectionVentilation" (
    "idProtection" integer NOT NULL,
    classe character varying(50),
    "keyClasse" character varying(10),
    description character varying(255),
    e double precision,
    "eMultiF" double precision,
    f double precision,
    "fMultiF" double precision,
    "xDpe" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereProtectionVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRegulPAC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRegulPAC" (
    "idRegul" integer NOT NULL,
    "idGenerateur" integer,
    "idTypeRegulation" integer,
    "CregulPlancher" double precision,
    "CregulAutre" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRegulPAC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRendementDistributionECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRendementDistributionECS" (
    "idRd" integer NOT NULL,
    libelle character varying(50),
    "Rdecs" double precision,
    "prodVolHab" boolean,
    "PieceAlimContigu" boolean,
    "reseauIsole" boolean,
    "isCol" boolean,
    "isInd" boolean,
    "keyRd" character varying(5),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    av2007 boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRendementDistributionECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereReseauDistribution; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereReseauDistribution" (
    "idEnumereReseauDistribution" integer NOT NULL,
    "KEY_reseauDistribution" character varying(10) NOT NULL,
    "libelleReseauDistribution" character varying(100) NOT NULL,
    "Rd" double precision,
    "isMi" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "Rd0" double precision,
    "keyEmplacement" character varying(5),
    "inVolChauffe" boolean,
    "Rd0_Radiateur" double precision,
    tv integer,
    "tvIsole" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereReseauDistribution" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRetourInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRetourInvestissement" (
    "idEnumereRetourInvestissement" integer NOT NULL,
    "libelleRetourInvestissement" character varying(30) NOT NULL,
    "valeurRetourInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRetourInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRpnRadiateurGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRpnRadiateurGaz" (
    "idRpn" integer NOT NULL,
    "idCarac" integer,
    "hasVentilo" boolean,
    fmaj double precision,
    "Rpn" double precision,
    "Rpn1" double precision,
    "A" double precision,
    "B" double precision,
    "A1" double precision,
    "B1" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRpnRadiateurGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRr0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRr0" (
    "idRr0" integer NOT NULL,
    "isInd" boolean,
    "isCentral" boolean,
    "keyEmet" character varying(5),
    "hasRegul" boolean,
    "rR0" double precision,
    "xDPE" integer NOT NULL,
    "hasRegulCentral" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRr0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereRsRgReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRsRgReseau" (
    "idRsRg" integer NOT NULL,
    "RsRg" double precision,
    "isIso" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idDistrReseau" integer,
    "idIsoReseau" integer,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereRsRgReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereSourcing; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSourcing" (
    "idSource" integer NOT NULL,
    "keySource" character varying(10),
    lib character varying(255),
    "keyRes" character varying(255),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSourcing" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereSourcingDocument; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSourcingDocument" (
    "idDoc" integer NOT NULL,
    doc character varying(255),
    "idLib" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSourcingDocument" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereSystemeClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSystemeClimatisation" (
    "idEnumereSystemeClimatisation" integer NOT NULL,
    "idTypeEnergie" integer,
    "KeySystClim" character varying(10) NOT NULL,
    "libelleSystemeClim" character varying(100) NOT NULL,
    "systGaz" boolean NOT NULL,
    "systElectrique" boolean NOT NULL,
    "systCollectif" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereSystemeClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTch; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTch" (
    "idTCH" integer NOT NULL,
    min real,
    max real,
    "Tch" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTch" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbBaieUg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbBaieUg" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "keyVitrage" character varying(50),
    "isVertical" boolean,
    "isKrypton" boolean,
    epaisseur real,
    "isVIR" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbBaieUg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbBecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbBecs" (
    "idtvWB" integer NOT NULL,
    "isImm" boolean,
    "minS" real,
    "maxS" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbBecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbCatERP; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCatERP" (
    "idtvWB" integer NOT NULL,
    categorie character varying(50),
    groupe character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCatERP" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbConstante; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbConstante" (
    "idtvWB" integer NOT NULL,
    "table" character varying(50),
    code character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbConstante" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbCr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCr" (
    "idtvWB" integer NOT NULL,
    "isHorizontal" boolean,
    "isVsup75" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbCregul; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCregul" (
    "idtvWB" integer NOT NULL,
    "isPlancher" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbCregul" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbEuroRecommendation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbEuroRecommendation" (
    "idtvWB" integer NOT NULL,
    type character varying(50),
    "isEffort" boolean,
    "isEconomie" boolean,
    "isRetour" boolean,
    min real,
    max real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "typeDPE" character varying(50),
    "idlibDoc" integer,
    "libDoc" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbEuroRecommendation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbFecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbFecs" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    dpt character varying(2) NOT NULL,
    "isIC" boolean,
    "hasSolCh" boolean,
    "isEcsVieux" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbFecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbFuiteVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbFuiteVentilation" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "aRaEt" boolean,
    "aRaOu" boolean,
    "aRa" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbFuiteVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbInstallationEcs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbInstallationEcs" (
    "idtvWB" integer NOT NULL,
    "isUniqueAvecSol" boolean,
    "isUniqueSansSol" boolean,
    "isDoubleMI_IC" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbInstallationEcs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbKeyUsage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbKeyUsage" (
    "idtvWB" integer NOT NULL,
    type character varying(35),
    "keyUsage" integer,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbKeyUsage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbPciCo2; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPciCo2" (
    "idtvWB" integer NOT NULL,
    "idTypeEnergie" integer,
    "isENR" boolean,
    "is3CL" boolean,
    "keyUsage" integer,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPciCo2" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbPdim; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPdim" (
    "idtvWB" integer NOT NULL,
    "isMural" boolean,
    "isAvt2006" boolean,
    "minPdim" real,
    "maxPdim" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPdim" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbPecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPecs" (
    "idtvWB" integer NOT NULL,
    "minVs" real,
    "maxVs" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbPrs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPrs" (
    "idtvWB" integer NOT NULL,
    "idPrs" integer,
    "tvWB" character varying(10),
    "Hi" character varying(2),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbPrs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbQgw; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbQgw" (
    "idtvWB" integer NOT NULL,
    "isBelec" boolean,
    "isBaccu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbQgw" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbRgECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRgECS" (
    "idtvWB" integer NOT NULL,
    "isElec" boolean,
    "isChaudiere" boolean,
    "isMixte" boolean,
    "isAccuGaz" boolean,
    "isChBainInstantanne" boolean,
    "isThermo" boolean,
    "hasAppoint" boolean,
    "isRescha" boolean,
    "isIsole" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRgECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbRr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRr" (
    "idtvWB" integer NOT NULL,
    "idGenerateur" integer,
    "idTypeEmetteur" integer,
    "hasRegul" boolean,
    "isIndividuel" boolean,
    "hasRobinetTh" boolean,
    "isApartCombustion" boolean,
    "isAutreCas" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isMonotube" boolean,
    "idEnumereReseauDistribution" integer,
    "idLib" integer,
    "TVRr" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbRsecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRsecs" (
    "idtvWB" integer NOT NULL,
    "hasAccu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbRsecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbTfonc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTfonc" (
    "idtvWB" integer NOT NULL,
    "isT100" boolean,
    "typeChaudiere" character varying(2),
    "idAnciennete" integer,
    "idAncEmet" integer,
    "kT" character varying(1),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTfonc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDPE" (
    "idtvWB" integer NOT NULL,
    "idTypeDossierDPE" character varying(5),
    "tvWB" character varying(10),
    type character varying(20),
    modele character varying(20),
    "is3CL" boolean,
    "isFacture" boolean,
    "isUsage" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDescriptif; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDescriptif" (
    "idtvWB" integer NOT NULL,
    type character varying(65),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeDescriptif" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbTypeERP; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeERP" (
    "idtvWB" integer NOT NULL,
    key character varying(5),
    type character varying(150),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeERP" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbTypeParoiOpaque; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeParoiOpaque" (
    "idtvWB" integer NOT NULL,
    type character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbTypeParoiOpaque" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbUmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUmur" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "idEnumereAnneeConstruction" integer,
    "idEnumereUmurD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbUpb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUpb" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "isTpl" boolean,
    "2SP" real,
    "idEnumereAnneeConstruction" integer,
    "idEnumereUplancherD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUpb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTvwbUph; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUph" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "keyCORPlafond" character varying(5),
    "idEnumereAnneeConstruction" integer,
    "idEnumereUplafondD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTvwbUph" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEclairage" (
    "idEnumereTypeEclairage" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEmetteur" (
    "idTypeEmetteur" integer NOT NULL,
    "typeEmetteur" character varying(50),
    "Re" double precision,
    "isElecOnly" boolean,
    "isAirChaud" boolean,
    "isPlancher" boolean,
    "isPlafond" boolean,
    "isRadiateur" boolean,
    "RrCol" double precision,
    "RrRobinetCol" double precision,
    "RrInd" double precision,
    "RrRobinetInd" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "Rd" double precision,
    "keyMoteurType" integer,
    "keyMoteurRegul" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEquipementDivers" (
    "idEnumereTypeEquipementDivers" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeMenuiserie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeMenuiserie" (
    "idEnumereTypeMenuiserie" integer NOT NULL,
    "libelleMenuiserie" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeMenuiserie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeMur" (
    "idEnumereTypeMur" integer NOT NULL,
    "descriptionMur" character varying(255) NOT NULL,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    kpim double precision NOT NULL,
    kpibme double precision NOT NULL,
    kmen double precision NOT NULL,
    "Umur" double precision,
    "isOssatureBois" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer,
    "isoNat" character varying(10),
    "isAncien" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeRegulPac; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeRegulPac" (
    "idTypeRegulation" integer NOT NULL,
    regul character varying(50),
    "isDefaut" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeRegulPac" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeSourcing; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeSourcing" (
    "idTypeSourcing" integer NOT NULL,
    type character varying(50),
    "keyType" character varying(5),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeSourcing" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereTypeVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeVitrage" (
    "idEnumereTypeVitrage" integer NOT NULL,
    "libelleTypeVitrage" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereTypeVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUTerrePlein; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUTerrePlein" (
    "idTp" integer NOT NULL,
    ps smallint,
    upb double precision,
    "upbPost2001" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isTp" boolean,
    "xDpe" integer NOT NULL,
    "Uinit" double precision,
    "Tv" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUTerrePlein" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUfenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUfenetre" (
    "idEnumereUfenetre" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UfenetreSansVolet" real NOT NULL,
    "UfenetreAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUfenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUmur0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmur0" (
    "idEnumereUmur0" integer NOT NULL,
    "idEnumereTypeMur" integer,
    "epaisseurMur" real,
    "Umur" double precision NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "hasInertieLourde" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmur0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUmurD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmurD" (
    "idEnumereUmurD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UmurD" double precision NOT NULL,
    "UH1" double precision,
    "UH2" double precision,
    "UH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmurD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUmurInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmurInconnu" (
    "idEnumereUmurInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UmurH1Joule" double precision NOT NULL,
    "UmurH1Autre" double precision NOT NULL,
    "UmurH2Joule" double precision NOT NULL,
    "UmurH2Autre" double precision NOT NULL,
    "UmurH3Joule" double precision NOT NULL,
    "UmurH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUmurInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplafond0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafond0" (
    "idEnumereUplafond0" integer NOT NULL,
    "descriptionPlafond" character varying(50) NOT NULL,
    "Uplafond0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "isOssatureBois" boolean,
    "isCblAme" boolean,
    "isCblPerdu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer,
    "isoNat" character varying(10),
    "isAncien" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafond0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplafondD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafondD" (
    "idEnumereUplafondD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplafondD" double precision NOT NULL,
    "UplafondDCombleHabites" double precision NOT NULL,
    "UplafondDTerrasse" double precision NOT NULL,
    "UH1cbl" double precision,
    "UH2cbl" double precision,
    "UH3cbl" double precision,
    "UH1cblAme" double precision,
    "UH2cblAme" double precision,
    "UH3cblAme" double precision,
    "UH1ter" double precision,
    "UH2ter" double precision,
    "UH3ter" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafondD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplafondInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafondInconnu" (
    "idEnumereUplafondInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "isTerrasse" boolean NOT NULL,
    "UplafondH1Joule" double precision NOT NULL,
    "UplafondH1Autre" double precision NOT NULL,
    "UplafondH2Joule" double precision NOT NULL,
    "UplafondH2Autre" double precision NOT NULL,
    "UplafondH3Joule" double precision NOT NULL,
    "UplafondH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplafondInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplancher0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancher0" (
    "idEnumereUplancher0" integer NOT NULL,
    "descriptionPlancher" character varying(50) NOT NULL,
    "keyPlancher" character varying(5) NOT NULL,
    "Uplancher0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "isOssatureBois" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer,
    "isoNat" character varying(10),
    "isAncien" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancher0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplancherD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancherD" (
    "idEnumereUplancherD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplancherD" double precision NOT NULL,
    "UH1" double precision,
    "UH2" double precision,
    "UH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancherD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUplancherInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancherInconnu" (
    "idEnumereUplancherInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UplancherH1Joule" double precision NOT NULL,
    "UplancherH1Autre" double precision NOT NULL,
    "UplancherH2Joule" double precision NOT NULL,
    "UplancherH2Autre" double precision NOT NULL,
    "UplancherH3Joule" double precision NOT NULL,
    "UplancherH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUplancherInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUporte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUporte" (
    "idEnumereUporte" integer NOT NULL,
    "idEnumereTypeMenuiserie" integer,
    "typePorte" character varying(100) NOT NULL,
    "Uporte" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    "idLib" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUporte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereUveranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUveranda" (
    "idEnumereUveranda" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UverandaSansVolet" real NOT NULL,
    "UverandaAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereUveranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEenumereVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEenumereVentilation" (
    "idEnumereVentilation" integer NOT NULL,
    "idTypeVentilation" integer,
    "libelleVentilation" character varying(255) NOT NULL,
    "aRAet" double precision,
    "aRAou" double precision,
    "aRA" double precision NOT NULL,
    "Smea" double precision,
    "Qvarep" double precision,
    "isPuitClimatique" boolean,
    "isDFechangeur" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL,
    post2012 boolean,
    "Qvasouf" double precision,
    "keyVent" character varying(10),
    "E_type_Ventilation" integer,
    flt2012 integer,
    "idLib" integer,
    "idTypEnergie" integer,
    "tvQ4paConv" integer,
    "tvDebit" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEenumereVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEficheTechnique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEficheTechnique" (
    idft integer NOT NULL,
    "idSaisieLot" integer,
    categorie character varying(50),
    entree character varying(255),
    valeur text,
    "ordreCat" smallint,
    ordre smallint,
    "keySource" integer,
    "Tch" double precision,
    "Tecs" double precision,
    "Tclim" double precision,
    "Ubat" double precision,
    "BbioRef" double precision,
    "Bbio" double precision,
    "isInclus" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEficheTechnique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEgrilleEvaluation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEgrilleEvaluation" (
    "idEvaluation" integer NOT NULL,
    "idParcoursDossier" integer,
    "optGen" integer,
    "optGenSynthese" integer,
    q1nom text,
    q1num character varying(50),
    q1voie text,
    "q1CP" character varying(10),
    q1ville character varying(255),
    "q2Revenu" double precision,
    "q3nbOccupant" integer,
    q3enfant boolean,
    q3handi boolean,
    q3vieux boolean,
    q3gir boolean,
    q4residence boolean,
    q4location boolean,
    q4usufruit boolean,
    q4gratuit boolean,
    q4locataire boolean,
    q4nu boolean,
    q4autre boolean,
    "q4comAutre" text,
    q5arrete boolean,
    q5notif boolean,
    q5handi boolean,
    q5plomb boolean,
    q5rsd boolean,
    q5signalement boolean,
    q5autre boolean,
    q5saispas boolean,
    q6eco boolean,
    q6defaut boolean,
    q6medic boolean,
    q6besoin boolean,
    q6confort boolean,
    q6ecolo boolean,
    q6autre boolean,
    "q6comAutre" text,
    q7menage integer,
    q8confiance integer,
    q9perturbation integer,
    q10fond boolean,
    q10emprunt boolean,
    q10pauvre boolean,
    q11reste integer,
    q12mi boolean,
    q12ic boolean,
    q12copro boolean,
    q12syndic text,
    q12mono boolean,
    q12saispas boolean,
    q12autre boolean,
    "q12comAutre" text,
    q13pavillon boolean,
    "q13grandEnsemble" boolean,
    "q13maisonVille" boolean,
    "q13petitImm" boolean,
    q13haussmann boolean,
    q13maisonrurale boolean,
    q14qurface double precision,
    q14piece integer,
    q15entretien integer,
    q15precision text,
    q16adapte boolean,
    q16precision text,
    q17confort boolean,
    q17precision text,
    q18etat boolean,
    q18precision text,
    q19eco boolean,
    "q19precisionEco" text,
    q19facture integer,
    q19social integer,
    q20isolement integer,
    q21acces boolean,
    q21etage character varying(50),
    "q21nbEtage" double precision,
    q22dpe boolean,
    q22etiquette character varying(50),
    "q22dateDpe" timestamp without time zone,
    q23indiv boolean,
    q23coll boolean,
    q23gaz boolean,
    q23elec boolean,
    q23autre boolean,
    "q23comAutre" text,
    q23thermostat boolean,
    "q23comThermostat" text,
    "q23basseT" boolean,
    q24humidite boolean,
    q24ventil boolean,
    "q24ventilEau" boolean,
    q25chaud boolean,
    q25clim boolean,
    q26mur boolean,
    q26toit boolean,
    q26sol boolean,
    q26autre boolean,
    "q26comAutre" text,
    q26pp boolean,
    q26pv boolean,
    q27chute boolean,
    "q27comChute" text,
    q28infiltration boolean,
    "q28comInfiltration" text,
    q28pc boolean,
    q28pv boolean,
    q29etanche boolean,
    q29fermer boolean,
    q29grille boolean,
    q30sousol boolean,
    "q30comSouSol" text,
    q30fenetre boolean,
    "q30comFenetre" text,
    q30hsp boolean,
    "q30comHsp" text,
    q31potable boolean,
    "q31comPotable" text,
    q32nuisible boolean,
    "q32comNuisible" text,
    q33wc boolean,
    "q33comWc" text,
    q34wvbouche boolean,
    "q34comWCbouche" text,
    q35entretien boolean,
    "q35comEntretien" text,
    q36amiante boolean,
    "q36comAmiante" text,
    q36plomb boolean,
    "q36comPlomb" text,
    q36ernmt boolean,
    "q36comErnmt" text,
    "q36Radon" boolean,
    "q36comRadon" text,
    "q36Termite" boolean,
    "q36comTermite" text,
    q36merule boolean,
    "q36comMerule" text,
    q37incendie boolean,
    q37gaz boolean,
    q37appoint boolean,
    q38difficile boolean,
    q38complexe boolean,
    q39coupure boolean,
    q39dispositif boolean,
    q39piece boolean,
    q39denude boolean,
    q39disjoncteur boolean,
    q39prise boolean,
    q40escalier boolean,
    q40rampe boolean,
    qx1 boolean,
    qx1val integer,
    qx1com text,
    qx2 boolean,
    qx2val integer,
    qx2com text,
    qx3 boolean,
    qx3val integer,
    qx3com text,
    q21ascenseur boolean,
    q21quotidien boolean,
    q23absent boolean,
    q26desordre text,
    q31ecs boolean,
    "nomAcc" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEgrilleEvaluation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEgroupementFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEgroupementFacture" (
    "idGroupementFacture" integer NOT NULL,
    "idTypeEnergie" integer,
    "idSaisieLot" integer,
    "idEnumereCombustible" integer,
    "libelleGroupement" character varying(100),
    "typeGroupement" character varying(50),
    "pourChauffage" boolean NOT NULL,
    "pourECS" boolean NOT NULL,
    "pourClimatisation" boolean NOT NULL,
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "isCollectif" boolean,
    millieme integer,
    "milliemeBase" integer,
    "keyUsage" integer,
    "isMethodeMixte" boolean,
    "ratioENR" double precision,
    "isRachat" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEgroupementFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEinfoPreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEinfoPreconisation" (
    "idInfos" integer NOT NULL,
    "idDetailPreconisation" integer,
    "isIn" boolean,
    libelle character varying(255),
    info text,
    "idType" integer,
    ordre integer,
    "pInter" double precision,
    c1 double precision,
    c2 double precision,
    c3 double precision,
    bc3 boolean,
    tc4 text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEinfoPreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPElisteAideParcours; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPElisteAideParcours" (
    "idAide" integer NOT NULL,
    "idParcoursDossier" integer,
    libelle character varying(255),
    detail text,
    montant double precision,
    "montantMin" double precision,
    "montantMax" double precision,
    "isFourchette" boolean,
    "guidAide" character varying(50),
    "isInclus" boolean,
    "typeMpr" integer,
    "isNational" boolean,
    ordre integer,
    cout double precision,
    "isCee" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPElisteAideParcours" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPElocQteEfImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPElocQteEfImmeuble" (
    "idLocQteEfImmeuble" integer NOT NULL,
    "idTypeEnergie" integer,
    "idMission" integer,
    "idEnumereCombustible" integer,
    "KEYusage" integer,
    "ConsoEf" double precision,
    "ratioLot" integer,
    "ratioImmeuble" integer,
    "Bch" double precision,
    depense double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPElocQteEfImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPElotBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPElotBaie" (
    "idBaie" integer NOT NULL,
    "idLot" integer,
    nom character varying(255),
    surface real,
    orientation smallint
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPElotBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPElotSurfaces; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPElotSurfaces" (
    "idSurfaces" integer NOT NULL,
    "idLot" integer,
    type character varying(50),
    "typeEnergie" character varying(50),
    surface real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPElotSurfaces" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEmateriauThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEmateriauThBat" (
    "idMateriauThBat" integer NOT NULL,
    "MATERIAUPARENT_idMateriauThBat" integer,
    libelle character varying(255) NOT NULL,
    rho character varying(100),
    lambda double precision,
    commentaire text,
    "isIsolant" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEmateriauThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEparcoursDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEparcoursDossier" (
    "idParcoursDossier" integer NOT NULL,
    "idMission" integer,
    "nbOccupant" integer,
    enfant integer,
    "revenuFiscal" double precision,
    "catRessource" integer,
    "typeUtilisationLogement" integer,
    "statutPropritaire" integer,
    "typeOccupation" integer,
    "typeProprietaire" integer,
    "isEligibleAdmin" integer,
    "isEligibleGlobal" integer,
    "isMprPA" boolean,
    "isMpr" boolean,
    "isAide1" boolean,
    "isAide2" boolean,
    "isAide3" boolean,
    "isAide4" boolean,
    "isAide5" boolean,
    "isMprCopro" boolean,
    "nbLotTotaux" double precision,
    "nbLogement" double precision,
    "nbLogementModeste" double precision,
    "nbLogementTresModeste" double precision,
    "tantiemeTotaux" double precision,
    "tantiemeHabitation" double precision,
    "coproFragile" integer,
    "zoneNpnru" integer,
    "tauxImpaye" double precision,
    "typeCopro" integer,
    "coutPrestation" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEparcoursDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpieceSaisie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpieceSaisie" (
    "idPieceSaisie" integer NOT NULL,
    "idSaisieLot" integer,
    "libellePiece" character varying(50) NOT NULL,
    "libelleEtage" character varying(20),
    "numeroPiece" integer,
    surface double precision,
    nb integer,
    "numEtage" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpieceSaisie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationClimatisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailClimatisation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationEclairage" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEclairage" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationEquipementDivers" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEquipementDivers" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationFenetre" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationGenerateur" (
    "idDetailPreconisation" integer NOT NULL,
    "idSaisieGenerateur" integer,
    "isECS" boolean,
    "isChauffage" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationMur" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPlafond" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPlancher" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPorte" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationSourceEnergie" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailSourceEnergie" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEpreconisationVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationVentilation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailVentilation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEpreconisationVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEprixEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEprixEnergie" (
    "idPrixEnergie" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idTypeEnergie" integer,
    "libellePrixEnergie" character varying(100) NOT NULL,
    "prix_kWh" double precision NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "minConsommation" real,
    "maxConsommation" real,
    "tarifAbonnement" double precision,
    "simpleTarif" boolean NOT NULL,
    "doubleTarif" boolean,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEprixEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEreferentNotationElementDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEreferentNotationElementDPE" (
    "idReferentNotationElementDPE" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    valeur1 double precision NOT NULL,
    valeur2 double precision NOT NULL,
    valeur3 double precision NOT NULL,
    valeur4 double precision NOT NULL,
    valeur5 double precision NOT NULL,
    valeur6 double precision NOT NULL,
    valeur7 double precision NOT NULL,
    valeur8 double precision NOT NULL,
    valeur9 double precision NOT NULL,
    valeur10 double precision NOT NULL,
    valeur11 double precision NOT NULL,
    valeur12 double precision NOT NULL,
    valeur13 double precision NOT NULL,
    valeur14 double precision NOT NULL,
    valeur15 double precision NOT NULL,
    valeur16 double precision NOT NULL,
    valeur17 double precision NOT NULL,
    valeur18 double precision NOT NULL,
    valeur19 double precision NOT NULL,
    valeur20 double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEreferentNotationElementDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEressourcesReleve; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEressourcesReleve" (
    "idPhoto" integer NOT NULL,
    idft integer NOT NULL,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "isGenerer" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEressourcesReleve" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEressourcesSaisieLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEressourcesSaisieLot" (
    "idResSl" integer NOT NULL,
    "idSaisieLot" integer NOT NULL,
    "titreRes" character varying(255),
    "comRes" text,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "typeRes" integer,
    key character varying(50),
    ordre integer,
    "isAnnexe" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEressourcesSaisieLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsaisieIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieIsolant" (
    "idSaisieIsolant" integer NOT NULL,
    "Risolant_saisie" double precision,
    "epaisseurIsolantSaisie" double precision,
    "anneeIsolationSaisie" character varying(30),
    "Ud" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsaisieLexique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieLexique" (
    "idSaisieLexique" integer NOT NULL,
    "idMission" integer,
    "isIn" boolean,
    titre character varying(255),
    "lexLibre" text,
    "lexFixe" text,
    "isLexFixe" boolean,
    "keyAmeliorer" character varying(10),
    cust1 boolean,
    cust2 double precision,
    cust3 character varying(255)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieLexique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsaisieLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieLot" (
    "idSaisieLot" integer NOT NULL,
    "idEnumereEffortInvestissement" integer,
    "RELETATINITETATPROJ_idSaisieLot" integer,
    "idAbonnementEnergie" integer,
    "idEnumereRetourInvestissement" integer,
    "idMission" integer,
    "idEnumereEconomies" integer,
    "RELDTLCALCUL_idSaisieLot" integer,
    "libelleSaisieLot" character varying(255),
    consommation double precision,
    "effortInvestissement" integer,
    "retourInvestissement" integer,
    economies integer,
    "pourcentageCreditImpot" double precision,
    "isGenerer" boolean NOT NULL,
    "isActionImmediate" boolean NOT NULL,
    "isVirtuel" boolean NOT NULL,
    "Vecs" double precision,
    "Nadeq" double precision,
    "keyBouquet" character varying(10),
    "isHomogene" boolean,
    "idRset" uuid,
    "contrainteArchi" text,
    "contrainteEco" text,
    "infosCompl" text,
    "numEtape" integer,
    "isScenarMono" boolean,
    "isScenarMulti" boolean,
    "isScenar1" boolean,
    "isScenar2" boolean,
    "isScenarCompl" boolean,
    "titreScenarCompl" character varying(50),
    "idScenarCompl" uuid,
    "idArchi" integer,
    "idEco" integer,
    interfaces text,
    "renouvAir" text,
    "nbNivAudit" character varying(255),
    "nbLogAudit" character varying(255),
    "nbPieceAudit" character varying(255),
    "mitoyenneteAudit" text,
    "ordreSc" integer,
    "idSimulation" character varying(255),
    "isMonoPoste" boolean,
    "isIncitatif" boolean,
    "comAudit" text,
    "inertieSimu" character varying(50),
    "MiAncienneSimu" integer,
    "auditIntegrationBien" text,
    "auditTypologie" character varying(255),
    "auditOrientationFacade" character varying(255),
    "auditAptitudeConfort" text,
    "avantageScenario" text,
    "mTravHT" double precision,
    "mTravTTC" double precision,
    "mTravEligibleHT" double precision,
    "mTravEligibleTTC" double precision,
    "typeRevenu" integer,
    "rFiscal" double precision,
    "isEligibleAdmin" integer,
    "isEligibleGlobal" integer,
    "mBonif" double precision,
    "hasBonif" boolean,
    "plafondEligible" double precision,
    "tauxAide" double precision,
    ecretement double precision,
    "resteAcharge" double precision,
    "aideCumulAuroise" double precision,
    "totAideMpr" double precision,
    "totAideAutre" double precision,
    "gainClasse" integer,
    "plafondTravaux" double precision,
    "maxTtc" double precision,
    "montantAideDispo" double precision,
    "cumulAutreAide" double precision,
    "montantDepassement" double precision,
    m1 double precision,
    m2 double precision,
    "tagRetenu" integer,
    "projetRenov" text,
    "resteAchargeReel" double precision,
    "coutAutreAide" double precision,
    m3 double precision,
    m4 double precision,
    "pGain" double precision,
    "mNprnru" double precision,
    "mCee" double precision,
    "mIndiv" double precision,
    "plafondAmo" double precision,
    "mAmo" double precision,
    "maxPtz" double precision,
    "isMprChoix" boolean,
    "isSimu3PT" boolean,
    "uBatCalcule" double precision,
    "uBatRef" double precision,
    "hasUsage" boolean,
    "idQRcode" uuid,
    "previewQRcode" bytea,
    "resTypeQRcode" character varying(50),
    "isAuditCopro" boolean,
    "isChoixCopro" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsaisiePathologie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsaisiePathologie" (
    "idPatho" integer NOT NULL,
    "idSaisieLot" integer,
    description text,
    solution text,
    type character varying(5),
    cust1 boolean,
    cust2 integer,
    cust3 double precision,
    cust4 text,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "isPathologie" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsaisiePathologie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsaisieVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieVitrage" (
    "idSaisieVitrage" integer NOT NULL,
    "epaisseurLameAir" character varying(20),
    argon boolean NOT NULL,
    volet boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsaisieVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEscenarioOccupation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEscenarioOccupation" (
    "idScenario" integer NOT NULL,
    "idJour" integer,
    "idHeure" integer,
    "Occupation" boolean,
    "Type" character varying(1),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEscenarioOccupation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsortieMoteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsortieMoteur" (
    "idResultat" integer NOT NULL,
    "idSaisieLot" integer,
    "isDepensier" boolean,
    "apportsInternesCh" double precision,
    "apportsInternesFr" double precision,
    "apportsSolairesCh" double precision,
    "apportsSolairesFr" double precision,
    "Bch" double precision,
    "Becs" double precision,
    "Bfr" double precision,
    "carboneTotal" double precision,
    "CauxDist" double precision,
    "CauxDistCh" double precision,
    "CauxDistEcs" double precision,
    "Cch" double precision,
    "CchAppointElec" double precision,
    "CchBois" double precision,
    "CchCharbon" double precision,
    "CchElectricite" double precision,
    "CchEpM2" double precision,
    "CchFioul" double precision,
    "CchGaz" double precision,
    "CchPropane" double precision,
    "CchRCU" double precision,
    "CchSolaire" double precision,
    "Ceclairage" double precision,
    "Cecs" double precision,
    "CecsBois" double precision,
    "CecsElectricite" double precision,
    "CecsEpM2" double precision,
    "CecsFioul" double precision,
    "CecsGaz" double precision,
    "CecsPropane" double precision,
    "CecsRCU" double precision,
    "CelecAc" double precision,
    "Cfr" double precision,
    "CfrElectricite" double precision,
    "CfrEpM2" double precision,
    "Ctotal" double precision,
    "CtotalEf" double precision,
    "CtotalEfAPV" double precision,
    "Cvent" double precision,
    "fractionApportsGratuit" double precision,
    "Nadeq" double precision,
    "pertesDistEcsRecup" double precision,
    "pertesGenChRecup" double precision,
    "pertesStockageEcsRecup" double precision,
    "Ppv" double precision,
    "Qaux" double precision,
    "QauxCh" double precision,
    "Qauxecs" double precision,
    "V40ecsJournalier" double precision,
    "enrCauxDist" double precision,
    "enrCauxDistCh" double precision,
    "enrCauxDistEcs" double precision,
    "enrCchElectricite" double precision,
    "enrCchAppointElec" double precision,
    "enrEclairage" double precision,
    "enrCecsElectricite" double precision,
    "enrCfrelectricite" double precision,
    "enrQaux" double precision,
    "enrQauxCh" double precision,
    "enrQauxEcs" double precision,
    "enrAuxVent" double precision,
    "enrAuxFroid" double precision,
    "coutBoisAutresCh" double precision,
    "coutBoisAutresEcs" double precision,
    "coutBoisGranulesBriquettesCh" double precision,
    "coutBoisGranulesBriquettesEcs" double precision,
    "coutButaneCh" double precision,
    "coutButaneEcs" double precision,
    "coutCharbonCh" double precision,
    "coutElecAu" double precision,
    "coutElecAux" double precision,
    "coutElecCh" double precision,
    "coutElecEcl" double precision,
    "coutElecEcs" double precision,
    "coutElecAuxFr" double precision,
    "coutElecVent" double precision,
    "coutFioulCh" double precision,
    "coutFioulEcs" double precision,
    "coutGazCollCh" double precision,
    "coutGazCollEcs" double precision,
    "coutGazIndivCh" double precision,
    "coutGazIndivEcs" double precision,
    "coutPropaneCh" double precision,
    "coutPropaneEcs" double precision,
    "coutRcuCh" double precision,
    "coutRcuECs" double precision,
    "coutTotal" double precision,
    "coutTotalAvecmobilier" double precision,
    "Cchbutane" double precision,
    "Cecsbutane" double precision,
    "CelecAcAu" double precision,
    "CelecAcAux" double precision,
    "CelecAcCh" double precision,
    "CelecAcEcl" double precision,
    "CelecAcFr" double precision,
    "CelecAcVent" double precision,
    "CtotalaPV" double precision,
    "CelecAcEcs" double precision,
    "coutElecFr" double precision,
    "CchBoisBuches" double precision,
    "CchBoisGranules" double precision,
    "CchBoisForestieres" double precision,
    "CchBoisIndustrie" double precision,
    "CecsBoisBuches" double precision,
    "CecsBoisGranules" double precision,
    "CecsBoisForestieres" double precision,
    "CecsBoisIndustrie" double precision,
    "CecsCharbon" double precision,
    "coutCharbonEcs" double precision,
    "coutElecAuxCh" double precision,
    "coutElecAuxEcs" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsortieMoteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingChauffage" (
    "idSourcing" integer NOT NULL,
    "idSaisieGenerateur" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingEcs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingEcs" (
    "idSourcing" integer NOT NULL,
    "idSaisieGenerateur" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingEcs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingEts; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingEts" (
    "idSourcing" integer NOT NULL,
    "idVeranda" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingEts" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingFenetre" (
    "idSourcing" integer NOT NULL,
    "idDetailEnveloppe" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingFr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingFr" (
    "idSourcing" integer NOT NULL,
    "idDetailClimatisation" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingFr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingGeneral" (
    "idSourcing" integer NOT NULL,
    "idSaisieLot" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingMur" (
    "idSourcing" integer NOT NULL,
    "idDetailEnveloppe" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingPT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPT" (
    "idSourcing" integer NOT NULL,
    "idDetailPT" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" character varying(255),
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingPV; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPV" (
    "idSourcing" integer NOT NULL,
    "idDetailCpt" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPV" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPlafond" (
    "idSourcing" integer NOT NULL,
    "idDetailEnveloppe" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPlancher" (
    "idSourcing" integer NOT NULL,
    "idDetailEnveloppe" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPorte" (
    "idSourcing" integer NOT NULL,
    "idDetailEnveloppe" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsourcingVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingVentilation" (
    "idSourcing" integer NOT NULL,
    "idDetailVentilation" integer,
    lib character varying(255),
    "keyRes" character varying(255),
    res integer,
    "libDoc" text,
    ordre integer,
    valeur character varying(255),
    "idlibDoc" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsourcingVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsurfaceDeperditive; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsurfaceDeperditive" (
    "idSurfaceDeperditive" integer NOT NULL,
    "idDetailEnveloppe" integer,
    "idCotePiece" integer,
    "surfaceSaisie" double precision NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsurfaceDeperditive" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEsyntheseEvaluation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEsyntheseEvaluation" (
    "idSynthese" integer NOT NULL,
    "idParcoursDossier" integer,
    nom text,
    num character varying(50),
    voie text,
    cp character varying(10),
    ville character varying(300),
    siret character varying(50),
    "dateVisite" timestamp without time zone,
    degradation boolean,
    insalubrite boolean,
    iso boolean,
    chauffage boolean,
    adaptation boolean,
    reparation boolean,
    amelioration boolean,
    indigne boolean,
    "comIndigne" text,
    "comManifeste" text,
    orientation boolean,
    propre boolean,
    externe boolean,
    "comOrientation" text,
    "orientationAdaptation" boolean,
    "comAdaptation" text,
    observations text,
    "dateRealisation" timestamp without time zone,
    x1 boolean,
    x1val integer,
    x1com text,
    x2 boolean,
    x2val integer,
    x2com text,
    x3 boolean,
    x3val integer,
    x3com text,
    "optGen" integer,
    "nomAcc" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEsyntheseEvaluation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEtypeDossierDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEtypeDossierDPE" (
    "idTypeDossierDPE" character varying(5) NOT NULL,
    "idClasseConsommationEnergie" integer NOT NULL,
    "idClasseEmissionGES" integer NOT NULL,
    "libelleTypeDossierDPE" character varying(255) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEtypeDossierDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEtypeEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEtypeEnergie" (
    "idTypeEnergie" integer NOT NULL,
    "KEYenergie" character varying(10),
    "libelleEnergie" character varying(30) NOT NULL,
    "alphaPCSI" real NOT NULL,
    "coeffEP" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "alphaPCSI2020" double precision,
    "coeffEP2020" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEtypeEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEtypeNiveau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEtypeNiveau" (
    "idTypeNiveau" integer NOT NULL,
    "libelleNiveau" character varying(30) NOT NULL,
    "NIV" double precision NOT NULL,
    "comblesHabite" boolean NOT NULL,
    "Cniv" smallint NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEtypeNiveau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEtypeVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEtypeVentilation" (
    "idTypeVentilation" integer NOT NULL,
    "typeVentilation" character varying(4) NOT NULL,
    "IauxVentIC" real NOT NULL,
    "IauxVentMIcentral" real NOT NULL,
    "IauxVentMIdivise" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "xDpe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEtypeVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEzoneEte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEzoneEte" (
    "idZoneEte" character varying(2) NOT NULL,
    "RclimMI1" real NOT NULL,
    "RclimMI2" real NOT NULL,
    "RclimIC1" real NOT NULL,
    "RclimIC2" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEzoneEte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) XDPEzoneHiver; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) XDPEzoneHiver" (
    "idZoneHiver" character varying(2) NOT NULL,
    "Tef" real NOT NULL,
    "CoeffCOMPL" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "Seer2008" real,
    "Seer2014" real,
    "Seer2020" real,
    "Seer2021" real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) XDPEzoneHiver" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) abonnementEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) abonnementEnergie" (
    "idAbonnementEnergie" integer NOT NULL,
    "idPrixEnergie" integer,
    "ABONNEMENTGAZ_idPrixEnergie" integer,
    "prixAboElectrique" double precision,
    "prixAboGaz" double precision,
    "aboElectriqueIsCollectif" boolean,
    "aboGazIsCollectif" boolean,
    "valeurAboElec" double precision,
    "valeurAboGaz" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) abonnementEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) assocDetailEnvMateriauxThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) assocDetailEnvMateriauxThBat" (
    "idAssocDetailEnvMateriauxThBat" integer NOT NULL,
    "idDetailEnveloppe" integer,
    libelle character varying(255),
    lambda double precision,
    epaisseur double precision,
    "isPourR" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) assocDetailEnvMateriauxThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) batiment; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) batiment" (
    "idBatiment" integer NOT NULL,
    "idSaisieLot" integer,
    nom character varying(255),
    shon real,
    surface real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) batiment" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) batimentLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) batimentLot" (
    "idLot" integer NOT NULL,
    "idBatiment" integer,
    nom character varying(255),
    surface real,
    "surfaceHaut" real,
    "surfaceBas" real,
    "surfaceVerticale" real,
    "isDPE" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) batimentLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) classeConsommationEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) classeConsommationEnergie" (
    "idClasseConsommationEnergie" integer NOT NULL,
    "classConso_A" integer NOT NULL,
    "classConso_B" integer NOT NULL,
    "classConso_C" integer NOT NULL,
    "classConso_D" integer NOT NULL,
    "classConso_E" integer NOT NULL,
    "classConso_F" integer NOT NULL,
    "classConso_G" integer NOT NULL,
    "classConso_H" integer NOT NULL,
    "classConso_I" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) classeConsommationEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) classeEmissionGES; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) classeEmissionGES" (
    "idClasseEmissionGES" integer NOT NULL,
    "classEmission_A" integer NOT NULL,
    "classEmission_B" integer NOT NULL,
    "classEmission_C" integer NOT NULL,
    "classEmission_D" integer NOT NULL,
    "classEmission_E" integer NOT NULL,
    "classEmission_F" integer NOT NULL,
    "classEmission_G" integer NOT NULL,
    "classEmission_H" integer NOT NULL,
    "classEmission_I" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) classeEmissionGES" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) coeffKpbmRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) coeffKpbmRconnu" (
    "idCoeffKpbmRconnu" integer NOT NULL,
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    kpbm double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) coeffKpbmRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) coeffKtpmeRconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) coeffKtpmeRconnu" (
    "minRisolant" double precision NOT NULL,
    "maxRisolant" double precision NOT NULL,
    ktpme double precision NOT NULL,
    "idCoeffKtpmeRconnu" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) coeffKtpmeRconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) coeffLineiqueRefendMurExterieur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) coeffLineiqueRefendMurExterieur" (
    "idCoeffLineiqueRefendMurExterieur" integer NOT NULL,
    "idEnumereConfiguration" integer,
    "idTypeNiveau" integer,
    "Lrem" double precision NOT NULL,
    "minSurface" integer NOT NULL,
    "maxSurface" integer NOT NULL,
    "NIV" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) coeffLineiqueRefendMurExterieur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) coeffbCirc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) coeffbCirc" (
    "idCoeffbCirc" integer NOT NULL,
    "isIsole" boolean NOT NULL,
    "isCirculationCentrale" boolean NOT NULL,
    "haveSAS" boolean NOT NULL,
    "isRDC" boolean NOT NULL,
    b double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) coeffbCirc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constanteDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constanteDPE" (
    "idConstanteDPE" integer NOT NULL,
    "arretePrixEnergie" character varying(255) NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "PeoDefaut" double precision NOT NULL,
    "coeffPpv" double precision NOT NULL,
    "coeffPco" double precision NOT NULL,
    "retrancheUfenetreSaisie" double precision NOT NULL,
    "retrancheUfenetreVolet" double precision NOT NULL,
    "retrancheUfenetreArgon" double precision NOT NULL,
    "TVA_recommandation" double precision NOT NULL,
    "TVA_autre" double precision NOT NULL,
    "nomMethode" character varying(50) NOT NULL,
    "versionMethode" character varying(10) NOT NULL,
    "nbDigitsGeneration" integer,
    "coeffUfenLocNonChauffe" double precision,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision,
    "isGenererEtiquette" boolean NOT NULL,
    "isGenererTextEtiquette" boolean NOT NULL,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "UmurInconnu" double precision,
    "UplafondInconnu" double precision,
    "UplancherInconnu" double precision,
    "TintCons" real,
    "TbaseExtH1" real,
    "TbaseExtH2" real,
    "TbaseExtH3" real,
    "TetaH1" real,
    "TetaH2" real,
    "TetaH3" real,
    "TextMoyH1" double precision,
    "TextMoyH2" double precision,
    "TextMoyH3" double precision,
    "isCalculInvestissementAuto" boolean,
    "PrevisualisationResultat" boolean,
    "IntervalCalculPrevisualisation" integer,
    "PrendreCompteERpourFactures" boolean,
    "GenerationDescLot" integer,
    "pieChartMode" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constanteDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constanteDPE_IC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constanteDPE_IC" (
    "idConstanteDPE_IC" integer NOT NULL,
    "Io" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "Rd1IsoleAeraulique" double precision NOT NULL,
    "Rd1IsoleHauteT" double precision NOT NULL,
    "Rd1IsoleBasseT" double precision NOT NULL,
    "Rd1Aeraulique" double precision NOT NULL,
    "Rd1HauteT" double precision NOT NULL,
    "Rd1BasseT" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "UmurIsoleLnc" double precision NOT NULL,
    "UmurLnc" double precision NOT NULL,
    "CORclimGaz" double precision NOT NULL,
    "PsTarifJaune" double precision,
    "AboTarfiJaune" double precision,
    "prixChauffageJaune" double precision,
    "prixECSJaune" double precision,
    "prixRefroidissementJaune" double precision,
    "CgazB2S" double precision,
    "aboGazB2S" double precision,
    "prixGazB2S" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constanteDPE_IC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constanteDPE_MI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constanteDPE_MI" (
    "idConstanteDPE_MI" integer NOT NULL,
    "IauxSolaire" double precision NOT NULL,
    "Io" double precision NOT NULL,
    "cteCOMPLLeger" double precision NOT NULL,
    "cteCOMPLLourd" double precision NOT NULL,
    "SseDefaut" double precision NOT NULL,
    "SseVitrageSudDegage" double precision NOT NULL,
    "Sportes" double precision NOT NULL,
    "aRApuitProvencal" double precision NOT NULL,
    "UporteIsole" double precision NOT NULL,
    "UporteSAS" double precision NOT NULL,
    "COR_ClimGaz" double precision NOT NULL,
    "kmenITE" double precision NOT NULL,
    "kpimITIrupteur" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constanteDPE_MI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constanteGenerique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constanteGenerique" (
    "KEY_constanteGenerique" character varying(30) NOT NULL,
    "intValue" integer,
    "doubleValue" double precision,
    "textValue" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constanteGenerique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constantePontThermiqueIC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constantePontThermiqueIC" (
    "idConstantePontThermiqueIC" integer NOT NULL,
    "kpbemeITISsChape" double precision NOT NULL,
    "kpbemeITESsChape" double precision NOT NULL,
    "kpbemeAutreSsChape" double precision NOT NULL,
    "kpbemeITIAutre" double precision NOT NULL,
    "kpbemeITEAutre" double precision NOT NULL,
    "kpbemeAutreAutre" double precision NOT NULL,
    "kpbimeITISsChape" double precision NOT NULL,
    "kpbimeITESsChape" double precision NOT NULL,
    "kpbimeAutreSsChape" double precision NOT NULL,
    "kpbimeITIAutre" double precision NOT NULL,
    "kpbimeITEAutre" double precision NOT NULL,
    "kpbimeAutreAutre" double precision NOT NULL,
    "ktpmeChapeFlottanteITI" double precision NOT NULL,
    "ktpmePRE1982" double precision NOT NULL,
    "ktpmePlancherBasIsole" double precision NOT NULL,
    "kttemeITI" double precision NOT NULL,
    "kttemeITE" double precision NOT NULL,
    "kttemeAutre" double precision NOT NULL,
    "kttimeITI" double precision NOT NULL,
    "kttimeITE" double precision NOT NULL,
    "kttimeAutre" double precision NOT NULL,
    "ktcmeITILourd" double precision NOT NULL,
    "ktcmeITELourd" double precision NOT NULL,
    "ktcmeAutreLourd" double precision NOT NULL,
    "ktcmeITILeger" double precision NOT NULL,
    "ktcmeITELeger" double precision NOT NULL,
    "ktcmeAutreLeger" double precision NOT NULL,
    "krfmeITI" double precision NOT NULL,
    "krfmeITE" double precision NOT NULL,
    "krfmeAutre" double precision NOT NULL,
    "Klnc" double precision NOT NULL,
    kpibme double precision NOT NULL,
    "kpibmeITIandRupteur" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constantePontThermiqueIC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) constantesPontThermiqueMI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) constantesPontThermiqueMI" (
    "idConstantesPontThermiqueMI" integer NOT NULL,
    "kpbmVideSan" double precision NOT NULL,
    "kpbmVideSanITI" double precision NOT NULL,
    "kpbmChapeITI" double precision NOT NULL,
    "kpbmPre1982" double precision NOT NULL,
    "kpbmPre1982ITE" double precision NOT NULL,
    "kpbmPost1982" double precision NOT NULL,
    "kpbmPost1982ITE" double precision NOT NULL,
    "krfmITE" double precision NOT NULL,
    "krfmNonITE" double precision NOT NULL,
    krfpb double precision NOT NULL,
    "KpbmExt" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) constantesPontThermiqueMI" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) cotePiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) cotePiece" (
    "idCotePiece" integer NOT NULL,
    "idPieceSaisie" integer,
    "libelleCotePiece" character varying(50) NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) cotePiece" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailByEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailByEmetteur" (
    "idDetail" integer NOT NULL,
    "idSaisieGenerateur" integer,
    "idSaisieEmetteur" integer,
    "Rg" double precision,
    "Ich" double precision,
    "COPnom" double precision,
    "CchPCI" double precision,
    "mCch" double precision,
    "mCchEpM2" double precision,
    "I0" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailByEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailCalcul; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailCalcul" (
    "idSaisieLot" integer NOT NULL,
    "ENV" double precision,
    "DPmurs" double precision,
    "DPplafond" double precision,
    "DPplancher" double precision,
    "DPvitrage" double precision,
    "DPverandas" double precision,
    "DPportes" double precision,
    "aRA" double precision,
    "PT" double precision,
    "METEO" double precision,
    "INT_ermitence" double precision,
    "CLIMAT" double precision,
    "COMPL" double precision,
    "CchInd" double precision,
    "CchColl" double precision,
    "CecsInd" double precision,
    "CecsColl" double precision,
    "IauxInd" double precision,
    "IauxColl" double precision,
    "CauxInd" double precision,
    "CauxColl" double precision,
    "Bch" double precision,
    "Becs" double precision,
    "Smurs" double precision,
    "Stoit" double precision,
    "Splancher" double precision,
    "Svitrage" double precision,
    "Sverandas" double precision,
    "Sportes" double precision,
    "CchPCI" double precision,
    "CecsPCI" double precision,
    "CclimPCI" double precision,
    "CusagesRecensesPCI" double precision,
    "CauxPCI" double precision,
    "CauePCI" double precision,
    "CaugPCI" double precision,
    "CeclPCI" double precision,
    "CascenseurPCI" double precision,
    "CchEP" double precision,
    "CecsEP" double precision,
    "CclimEP" double precision,
    "CusagesRecensesEP" double precision,
    "CauxEP" double precision,
    "CaueEP" double precision,
    "CaugEP" double precision,
    "CeclEP" double precision,
    "CascenseurEP" double precision,
    "CchCO2" double precision,
    "CecsCO2" double precision,
    "CclimCO2" double precision,
    "CauxCO2" double precision,
    "CaueCO2" double precision,
    "CaugCO2" double precision,
    "CeclCO2" double precision,
    "CascenseurCO2" double precision,
    "Dch" double precision,
    "Decs" double precision,
    "Dclim" double precision,
    "DusagesRecenses" double precision,
    "Daux" double precision,
    "Decl" double precision,
    "Dascenseur" double precision,
    "Dtotal" double precision,
    "consommationAnnuelleEP" double precision,
    "consommationAnnuelleEPParm2" double precision,
    "emissionsGESAnnuelle" double precision,
    "emissionsGESAnnuelleParm2" double precision,
    "productionEnergieRenouvelableEP" double precision,
    "BV" double precision,
    "GV" double precision,
    "F" double precision,
    "Prs1" double precision,
    "Prs2" double precision,
    "mCchSolaire" double precision,
    "mCchAppointElec" double precision,
    "mCch" double precision,
    "mCchElectricite" double precision,
    "mCchGaz" double precision,
    "mCchFioul" double precision,
    "mCchBois" double precision,
    "mCchRCU" double precision,
    "mCchCharbon" double precision,
    "mCchPropane" double precision,
    "mCchEpM2" double precision,
    "Ps" double precision,
    "mBch" double precision,
    "mGV" double precision,
    "Sse" double precision,
    "Ai" double precision,
    "As" double precision,
    "E" double precision,
    "I0" double precision,
    "INT" double precision,
    "Inertie" character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailCalcul" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailClimatisation" (
    "idDetailClimatisation" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereSystemeClimatisation" integer,
    "idEnumereIauxClimatisation" integer,
    "descriptionClimatisation" character varying(150),
    "libelleSysteme" character varying(50),
    "pourcentageSurfaceClim" double precision,
    "CclimEP" double precision,
    "libelleEnergie" character varying(30),
    "prix_kWh_clim" double precision,
    "statutSaisie" integer NOT NULL,
    "surfaceClimatisee" double precision,
    "surfaceClimatiseeDernierEtage" double precision,
    "idEnumereCombustible" integer,
    "dateFabrication" timestamp without time zone,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailEclairage" (
    "idDetailEclairage" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailEnergies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailEnergies" (
    "idDetailEnergies" integer NOT NULL,
    "idSaisieLot" integer,
    "presenceGazIndividuel" boolean NOT NULL,
    "gazCuisson" boolean NOT NULL,
    "presenceGPL" boolean NOT NULL,
    "citerneGPLLocation" boolean NOT NULL,
    "citerneGPLAchete" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailEnergies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailEnveloppe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailEnveloppe" (
    "idDetailEnveloppe" integer NOT NULL,
    "libelleDetailEnveloppe" character varying(50) NOT NULL,
    surface double precision,
    "U" double precision,
    "coeffCorrecteur" double precision,
    "surfaceSaisie" double precision,
    "Usaisie" double precision,
    "statutSaisie" integer NOT NULL,
    "H" double precision,
    "L" double precision,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailEnveloppe" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailEquipementDivers" (
    "idDetailEquipementDivers" integer NOT NULL,
    "idSaisieLot" integer,
    description character varying(255) NOT NULL,
    "statutSaisie" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailImmeuble" (
    "idMission" integer NOT NULL,
    "idEnumerCORPlafond" integer,
    "SHbat" double precision,
    "nbNiveaux" real,
    "HSPmoyenne" double precision,
    "typeToiture" character varying(30),
    "SH_DernierEtage" double precision,
    "nbLogements" integer,
    "Shmoy" double precision,
    "nomCC" character varying(255),
    "NbrCircVerticaleCC" integer,
    "ScommercialeCC" double precision,
    "naturePrivativeCC" character varying(255),
    "hasSegmentationCC" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailInformationLogement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailInformationLogement" (
    "idMission" integer NOT NULL,
    "idEnumerePlageAltitude" integer,
    "idEnumereConfigurationAppartement" integer,
    "idEnumereAnneeConstruction" integer,
    dpt character varying(2),
    "idEnumereMIT" integer,
    "idEnumereConfiguration" integer,
    "anneeConstruction" character varying(30),
    "hauteurSsPlafond" double precision,
    "altitudeSaisie" double precision,
    "vitrageSudEnsolleilles" boolean,
    "surfaceHabitable" double precision,
    "nombreNiveaux" double precision,
    "MIT" double precision,
    "FOR_me" double precision,
    "perimetreSaisie" double precision,
    "comblesHabite" boolean,
    "pourcentageSurfaceSol" double precision,
    "pourcentageSurfaceComble" double precision,
    "pourcentageSurfaceTerrasse" double precision,
    etage character varying(50),
    "isDernierEtage" boolean,
    sas boolean,
    "perimetreSurExterieurNiv2" double precision,
    "perimetreSurExterieurNiv1" double precision,
    "perimetreSurExterieurNiv3" double precision,
    "circulationCentrale" boolean,
    "perimetreSurPartiesCommunes" double precision,
    "chauffageCentralSansComptage" boolean,
    "presenceAscenseur" boolean,
    millieme integer,
    "milliemeBase" integer,
    "nbOccupants" character varying(50),
    "keyInertie" character varying(50),
    "hasRegulParPiece" boolean,
    "idInter" integer,
    "idTypeChauffage" integer,
    "isCI" boolean,
    "idEmet" integer,
    "isERP" boolean,
    "idResFaceSud" uuid,
    "previewFaceSud" bytea,
    "idResFaceNord" uuid,
    "previewFaceNord" bytea,
    "idResFaceEst" uuid,
    "previewFaceEst" bytea,
    "idResFaceOuest" uuid,
    "previewFaceOuest" bytea,
    commentaire text,
    "idResVentilation" uuid,
    "previewVentilation" bytea,
    "tempChaufJour" character varying(50),
    "tempChaufNuit" character varying(50),
    "nbJourInoccupeAvecChauf" integer,
    "nbJourInoccupeSansChauf" integer,
    "nbOccupant" integer,
    "utilisationECS" character varying(255),
    "utilisationEclairage" character varying(255),
    "presenceAmpouleEco" character varying(255),
    "idResEnvSud" uuid,
    "previewEnvSud" bytea,
    "idResEnvNord" uuid,
    "previewEnvNord" bytea,
    "idResEnvEst" uuid,
    "previewEnvEst" bytea,
    "idResEnvOuest" uuid,
    "previewEnvOuest" bytea,
    orientation1 character varying(255),
    orientation2 character varying(255),
    orientation3 character varying(255),
    orientation4 character varying(255),
    "isCopro" boolean,
    "idTypeERP" integer,
    "idCatERP" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailInformationLogement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailMurPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailMurPorte" (
    "detailMur" integer,
    "detailPorte" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailMurPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailMurPorteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailMurPorteur" (
    "detailFenetre" integer,
    "detailMur" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailMurPorteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailNiveauImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailNiveauImmeuble" (
    "idDetailNiveauImmeuble" integer NOT NULL,
    "idMission" integer,
    "perimetreSurExterieur" double precision,
    "nbNiveauxIdentique" integer NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailNiveauImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailPlafondPorteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailPlafondPorteur" (
    "idDetailFenetre" integer,
    "idDetailPlafond" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailPlafondPorteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailPontThermique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailPontThermique" (
    "idPT" integer NOT NULL,
    "idSaisieLot" integer,
    "keyLineique" character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailPontThermique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailPreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailPreconisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idSaisieLot" integer,
    "preconisationTexte" text,
    "coutMin" double precision,
    "coutMax" double precision,
    "creditImpot" double precision,
    "commentairePreconisation" text,
    "isAutoApplique" boolean,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "isIn" boolean,
    "typeCredit" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailPreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEmetteur" (
    "idSaisieEmetteur" integer NOT NULL,
    "Rd" double precision,
    "Re" double precision,
    "Rr" double precision,
    "Rg" double precision,
    "Ich" double precision,
    "COPnom" double precision,
    "IchBase" double precision,
    "CchPCI" double precision,
    "idTypeEmetteur" integer,
    emetteur character varying(255),
    "hasRobinetThermo" boolean,
    "hasRegTherm" boolean,
    "isBasseT" boolean,
    "isChalDouce" boolean,
    "idAncEmet" integer,
    "mCch" double precision,
    "mCchEpM2" double precision,
    "I0" double precision,
    "INT" double precision,
    "Bch" double precision,
    "Pch" double precision,
    "idEnumereReseauDistribution" integer,
    "isDivise" boolean,
    "hasIntRegul" boolean,
    "idInter" integer,
    "isInterMixte" boolean,
    "surfaceChauffee" double precision,
    "Prs1" double precision,
    "Prs2" double precision,
    "idResPhoto" uuid,
    "previewPhoto" bytea
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEnvFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvFenetre" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUfenetre" integer,
    "idSaisieLot" integer,
    "idSaisieVitrage" integer NOT NULL,
    "descriptionFenetre" character varying(255),
    "Ucalcul" double precision,
    "Ksaisie" double precision,
    "isFenetreToit" boolean NOT NULL,
    "isITE" boolean NOT NULL,
    "isLocalNonChauffe" boolean NOT NULL,
    "keyParoi" character varying(50),
    "isDbleFenetre" boolean,
    "idVitrage" integer,
    "isVir" boolean,
    "isKrypton" boolean,
    "idUg" integer,
    "Ug" double precision,
    epaisseur real,
    "idMenuiserie" integer,
    "idParoiVitree" integer,
    "Uw" double precision,
    "idFermeture" integer,
    "Ujn" double precision,
    "idEnumereCorBaie" integer,
    "idEnumereDetailCorBaie" integer,
    "Aiu" real,
    "Aue" real,
    b real,
    "isParoiIso" boolean,
    "isIsoLnc" boolean,
    "idLnc" integer,
    "isFondLoggia" boolean,
    "isAuvent" boolean,
    avancee real,
    "L1" real,
    "L2" real,
    "isLateral" boolean,
    "isRetourSud" boolean,
    "alphaHomogene" real,
    "isMhomogene" boolean,
    "isMnonHomogene" boolean,
    "idPosition" integer,
    "idInclinaison" integer,
    "isNu" integer,
    "idLp" integer,
    "hasRetourIso" boolean,
    "idVitrage2" integer,
    "isVir2" boolean,
    "isKrypton2" boolean,
    "idUg2" integer,
    "Ug2" double precision,
    epaisseur2 real,
    "idMenuiserie2" integer,
    "idParoiVitree2" integer,
    "idUw2" integer,
    "Uw2" double precision,
    "Fts" double precision,
    "Fts2" double precision,
    "FtsSaisie" double precision,
    "Fts2Saisie" double precision,
    "idPositionFacade" integer,
    "isNu2" integer,
    "idLp2" integer,
    "hasRetourIso2" boolean,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEnvMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvMur" (
    "idDetailEnveloppe" integer NOT NULL,
    "idEnumereUmurD" integer,
    "idSaisieIsolant" integer,
    "idEnumereUmurInconnu" integer,
    "idEnumereUmur0" integer,
    "idEnumereTypeMur" integer,
    "idSaisieLot" integer,
    "idEnumereCORmur" integer,
    "typeParoi" character varying(255),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITE" boolean,
    "ITI" boolean,
    "ITR" boolean,
    "hasRupteur" boolean NOT NULL,
    "UsaisieContainsR" boolean NOT NULL,
    "idEnumereDetailCORmur" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "isIsoConnue" boolean,
    "detailIsLourd" integer,
    "idOrientation" integer,
    "idInclinaison" integer,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEnvPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPlafond" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumerCORPlafond" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplafond0" integer,
    "idEnumereUplafondInconnu" integer,
    "idEnumereUplafondD" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "ITI" boolean,
    "ITE" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean,
    "idEnumereDetailCORPlafond" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "isIsoConnue" boolean,
    "detailIsLourd" integer,
    "idOrientation" integer,
    "idInclinaison" integer,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEnvPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPlancher" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idSaisieIsolant" integer,
    "idEnumereUplancherD" integer,
    "idEnumereUplancherInconnu" integer,
    "idEnumereUplancher0" integer,
    "idEnumereCORsol" integer,
    "typeParoi" character varying(50),
    "epaisseurParoiSaisie" double precision,
    "U0calcul" double precision,
    "isLourd" boolean NOT NULL,
    "surfaceConnue" boolean NOT NULL,
    "positionParoi" character varying(50),
    "isolationSsChape" boolean,
    "ITE" boolean,
    "ITI" boolean,
    "UsaisieContainsR" boolean NOT NULL,
    "isIsoInconnu" boolean,
    "idEnumereDetailCORsol" integer,
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isIsoConnue" boolean,
    "isParoiIso" boolean,
    b real,
    "idLnc" integer,
    "detailIsLourd" integer,
    "perimetreTP" double precision,
    "surfaceTP" double precision,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieEnvPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPorte" (
    "idDetailEnveloppe" integer NOT NULL,
    "idSaisieLot" integer,
    "idEnumereUporte" integer,
    "descriptionPorte" character varying(255),
    "donneSurLNC" boolean NOT NULL,
    "isIsole" boolean NOT NULL,
    "hasSAS" boolean NOT NULL,
    "idEnumereCorMur" integer,
    "idEnumereDetailCorMur" integer,
    "Aiu" real,
    "Aue" real,
    b real,
    "isIsoLnc" boolean,
    "isParoiIso" boolean,
    "idLnc" integer,
    "idMur" integer,
    "isNu" integer,
    "idLp" integer,
    "hasRetourIso" boolean,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieEnvPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieFacture" (
    "idDetailSaisieFacture" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idGroupementFacture" integer,
    "idTypeEnergie" integer,
    "refDocument" character varying(50),
    "typeDocument" character varying(50),
    "depenseFacture" double precision,
    "quantiteEnergie" double precision,
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "dureeMois" double precision,
    "dateFacture" timestamp without time zone,
    "statutSaisie" integer,
    "isCollectif" boolean,
    "dateFinFacture" timestamp without time zone,
    "isRachat" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieGenerateur" (
    "idSaisieGenerateur" integer NOT NULL,
    "Fctindependant" boolean,
    "idGenerateur" integer,
    "idSaisieLot" integer,
    "nomInstall" character varying(50),
    "keyInstall" integer,
    "idInstall" integer,
    "idEnumereCombustible" integer,
    "isECS" boolean,
    "isChauffage" boolean,
    "isCollectif" boolean,
    "isIndividuel" boolean,
    "hasComptageInd" boolean,
    "descriptionChauffage" character varying(255),
    "descriptionECS" character varying(255),
    "presenceProgrammateur" boolean NOT NULL,
    "hasInstallationSolaireCh" boolean,
    "Fch_saisie" double precision,
    "Ich" double precision,
    "IchBase" double precision,
    "libelleEnergie" character varying(30),
    "Bch" double precision,
    "CchPCI" double precision,
    "Rg" double precision,
    "idRegulationPAC" integer,
    "COPdecl" double precision,
    "COPnom" double precision,
    "Cregul" double precision,
    "isNeuf" boolean,
    "hasCogeneration" boolean,
    "Nindependant" integer,
    "isPrioritaire" boolean,
    "hasRegul" boolean,
    "hasCondenFumee" boolean,
    "Prel" double precision,
    "Pnom" double precision,
    "Rpn" double precision,
    "Rpint" double precision,
    "idAnciennete" integer,
    "Tfonc100" double precision,
    "Tfonc30" double precision,
    "Pmfou" double precision,
    "Pmcons" double precision,
    "QP0" double precision,
    "Pveil" double precision,
    "hasVentilo" boolean,
    "isAirChaudCondens" boolean,
    "PcogeneEst" double precision,
    "PcogeneSaisie" double precision,
    "FctPrincipal" boolean,
    "FctRelevePAC" boolean,
    "FctCascade" integer,
    "FctCascadePriorite" boolean,
    "FctAppoint" boolean,
    "FctChauffageElec" boolean,
    "FctApointChaudierePAC" boolean,
    "FctBaseCollectif" boolean,
    "RsEcs" double precision,
    "RdEcs" double precision,
    "RgEcs" double precision,
    "CecsPCI" double precision,
    "ecsSolaire" boolean NOT NULL,
    "ecsSolaireVieux" boolean NOT NULL,
    veilleuse boolean NOT NULL,
    "FecsSaisie" double precision,
    "Iecs" double precision,
    "IecsBase" double precision,
    "isGRS" boolean,
    "prodVolHab" boolean,
    "PieceAlimContigu" boolean,
    "idRd" integer,
    "reseauIsole" boolean,
    "Vs" double precision,
    "Qgw" double precision,
    "Cr" double precision,
    "Cef" double precision,
    "ballonVolHab" boolean,
    "idCef" integer,
    "airExterieur" boolean,
    "COPecs" double precision,
    "idConduite" integer,
    "idDistrib" integer,
    "hasAppointECS" boolean,
    "hasBallonAccu" boolean,
    "InVolChauf" boolean,
    "statutSaisie" integer,
    "hasRapportChaudiere" boolean,
    "rapprtNonRequis" boolean,
    "dateFabrication" timestamp without time zone,
    "isNumeric" boolean,
    "nbPage" smallint,
    chemin character varying(255),
    commentaire text,
    "isMethodeMixte" boolean,
    "rachatEDFch" double precision,
    "rachatEDFecs" double precision,
    "isFactECS" boolean,
    "isFactCH" boolean,
    "Ni" integer,
    "Ne" integer,
    "Shi" double precision,
    "She" double precision,
    "SurfaceImmeuble" double precision,
    "isMural" boolean,
    "FctReleveBois" boolean,
    "Nich" integer,
    "Nech" integer,
    "Shich" double precision,
    "Shech" double precision,
    "Becs" double precision,
    "surfaceECS" double precision,
    "Prs2" double precision,
    "isCollectifECS" boolean,
    "isIndividuelECS" boolean,
    "Pch" double precision,
    "Pecs" double precision,
    "Prs1" double precision,
    "idAboElec" integer,
    "idAboGaz" integer,
    "idResRapportInsp" uuid,
    "previewDataRapportInsp" bytea,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    "idTypePacEcs" integer,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieLnc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieLnc" (
    "idLnc" integer NOT NULL,
    "idSaisieLot" integer,
    nom character varying(150),
    "Aiu" real,
    "Aue" real,
    "isLncISo" boolean,
    "isParoiIso" boolean,
    b real,
    "idCor" integer,
    "keyCOR" character varying(5),
    "idDetailCor" integer,
    "keyDetail" character varying(5),
    "isCblPerdu" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieLnc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisieMasqueLointain; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisieMasqueLointain" (
    "idMasque" integer NOT NULL,
    "idDetailEnveloppe" integer,
    nom character varying(255),
    alpha double precision,
    "isSud" boolean,
    "isHomogene" boolean,
    secteur character varying(50)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisieMasqueLointain" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSaisiePontThermique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSaisiePontThermique" (
    "idDetailPT" integer NOT NULL,
    "idPT" integer,
    "idP1" integer,
    "idP2" integer,
    longueur double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSaisiePontThermique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailSourceEnergie" (
    "idDetailSourceEnergie" integer NOT NULL,
    "idSaisieLot" integer,
    "idDetailChauffage" integer,
    "presenceCapteurSolaire" boolean NOT NULL,
    "PpvSaisie" double precision,
    "Spv" double precision,
    "presenceEolienne" boolean NOT NULL,
    "PeoSaisie" double precision,
    "presencePuitCanadien" boolean NOT NULL,
    "presenceCogeneration" boolean NOT NULL,
    "PcoSaisie" double precision,
    "Pautre" double precision,
    "statutSaisie" integer NOT NULL,
    "isVendu" boolean,
    "idTypeEnergie" integer,
    "isEolVendu" boolean,
    "rachatEDFSolaire" double precision,
    "rachatEDFeolien" double precision,
    "isFactEole" boolean,
    "isFactCapteur" boolean,
    "idResSolaire" uuid,
    "previewSolaire" bytea,
    "idResEolienne" uuid,
    "previewEolienne" bytea,
    "descriptifCapteur" text,
    "descriptifEolienne" text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailUsageRecense; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailUsageRecense" (
    "idDetailUsageRecense" integer NOT NULL,
    "idSaisieLot" integer,
    libelle character varying(150),
    "KEYusage" integer,
    "byUniteByEnergie" text,
    "efByEnergie" text,
    "ConsommationEP" double precision,
    "ConsommationPCI" double precision,
    "EmissionCO2" double precision,
    "Depense" double precision,
    "typeDetail" integer NOT NULL,
    "keyEnergie" character varying(10)
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailUsageRecense" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) detailVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) detailVentilation" (
    "idDetailVentilation" integer NOT NULL,
    "idEnumereVentilation" integer,
    "idSaisieLot" integer,
    "idTypeVentilation" integer,
    "descriptionVentilation" character varying(100),
    "aRA" double precision,
    "isFenSansJoint" boolean,
    "isChemSansTrappe" boolean,
    "statutSaisie" integer NOT NULL,
    "idResPhoto" uuid,
    "previewPhoto" bytea,
    descriptif text
);


ALTER TABLE public."(ADN_DIAG_DPE2012) detailVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) dossierDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) dossierDPE" (
    "idMission" integer NOT NULL,
    "idTypeDossierDPE" character varying(5),
    "RELSYNDIC2_idDossierDPE" integer,
    "RELDTLIMM_idDossierDPE" integer,
    "RELDTLLOG_idDossierDPE" integer,
    "dateVisite" timestamp without time zone,
    "dateEtablissementDiagnostic" timestamp without time zone,
    "dateValidite" timestamp without time zone,
    "diagnostiqueurNom" character varying(50),
    "diagnostiqueurPrenom" character varying(50),
    "typeBatiment" character varying(50),
    "addresseBien" character varying(50),
    methode character varying(30),
    "versionMethode" character varying(50),
    "datePrixEnergies" timestamp without time zone,
    commentaire text,
    "idIntervenant" integer,
    "suiviDossierDPE" integer,
    "typeTransaction" integer,
    "isLocReleveDeConso" boolean,
    "locShBat" double precision,
    "locPeriodeReleveConsommation" character varying(100),
    "isLocEstimationALImmeuble" boolean NOT NULL,
    "isLocPourLogementRepresentatif" boolean NOT NULL,
    "locRatioLot" integer,
    "locRatioImmeuble" integer,
    "locIdDossierDpeParent" integer,
    "isNotIncludeDescriptifLot" boolean,
    "isGroupFactSansUsage" boolean NOT NULL,
    "partieBatERP" character varying(255),
    "typeGenerationDescLot" integer NOT NULL,
    "isGenererEtiquette" boolean NOT NULL,
    "isGenererTextEtiquette" boolean NOT NULL,
    "etiquetteHeight" double precision,
    "etiquetteWidth" double precision,
    "isERP" boolean,
    "refADEME" character varying(255),
    "ChangeTime" timestamp without time zone,
    "isDPEplus" boolean,
    "commentaireMurs" text,
    "commentaireFermetures" text,
    "commentairePlafondPlancher" text,
    "commentaireInstalElec" text,
    "commentaireVentilation" text,
    "commentaireENR" text,
    "refTempADEME" character varying(255),
    "idGroupeRecommandation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) dossierDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) dptClimat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) dptClimat" (
    dpt character varying(2) NOT NULL,
    "idZoneHiver" character varying(2),
    "idZoneEte" character varying(2),
    "libelleDpt" character varying(50) NOT NULL,
    "altMin" integer NOT NULL,
    "altMax" integer NOT NULL,
    "Nref" integer NOT NULL,
    "Dhref" integer NOT NULL,
    "Pref" integer NOT NULL,
    "C3" double precision,
    "C4" integer,
    "tExtDeBase" real NOT NULL,
    "E" double precision NOT NULL,
    "Fch" double precision NOT NULL,
    "FecsAncienneMI" real NOT NULL,
    "FecsRecenteMI" real NOT NULL,
    "FecsSolaireMI" real NOT NULL,
    "FecsAncienneIC" real NOT NULL,
    "FecsRecenteIC" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) dptClimat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereAncienneteEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereAncienneteEmetteur" (
    "idAncEmet" integer NOT NULL,
    anicennete character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereAncienneteEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereAncienneteGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereAncienneteGenerateur" (
    "idAnciennete" integer NOT NULL,
    libelle character varying(100),
    "notRecommandable" boolean,
    min integer,
    max integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereAncienneteGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereAnneeConstruction; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereAnneeConstruction" (
    "idEnumereAnneeConstruction" integer NOT NULL,
    "libelleAnneeConstruction" character varying(30) NOT NULL,
    "anDepart" integer NOT NULL,
    "anFin" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereAnneeConstruction" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereApplicationRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereApplicationRecommandation" (
    "idEnumereApplicationRecommandation" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    "libelleRecommandation" text,
    "tarifMin" double precision,
    "tarifMax" double precision,
    "isTarifForfaitaire" boolean,
    "pourcentageCreditImpot" double precision,
    "isApplicableMaisonAncienne" boolean,
    "libelleRecommandationCourt" character varying(255),
    "isAutoApplicable" boolean,
    "isMI" boolean,
    "isIC" boolean,
    "R" double precision,
    "U" double precision,
    "idDonneSur" integer,
    "isITI" boolean,
    "isITE" boolean,
    "isITR" boolean,
    "epaisseurIso" double precision,
    "isRetourIso" boolean,
    "idEnumereUporte" integer,
    "porteIsolee" boolean,
    "porteSas" boolean,
    "isLourd" boolean,
    "idVentil" integer,
    "VentilJoint" boolean,
    "VentilTrappe" boolean,
    "idMenuiserieFilter" integer,
    "idVitrageFilter" integer,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "isDbleFenetre" boolean,
    "idVitrage" integer,
    "isVir" boolean,
    "isKrypton" boolean,
    "idUg" integer,
    "idMenuiserie" integer,
    "idParoiVitree" integer,
    "idFermeture" integer,
    "isNu" integer,
    "idLp" integer,
    "Ksaisie" double precision,
    "UsaisieContainsR" boolean,
    "hasRegulParPiece" boolean,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idGroupeRecommandation" integer,
    "typeCredit" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereApplicationRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereB; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereB" (
    "idB" integer NOT NULL,
    "Rsmin" real,
    "Rsmax" real,
    "Uvue" real,
    islnciso boolean,
    isliso boolean,
    b real,
    "tvWB" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereB" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieFermeture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieFermeture" (
    "idFermeture" integer NOT NULL,
    libelle character varying(255),
    "dR" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieFermeture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieMenuiserie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieMenuiserie" (
    "idMenuiserie" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieMenuiserie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieParoiVitree; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieParoiVitree" (
    "idParoiVitree" integer NOT NULL,
    "idMenuiserie" integer,
    libelle character varying(255),
    "isFenetre" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieParoiVitree" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieUg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieUg" (
    idug integer NOT NULL,
    "idVitrage" integer,
    epaisseur real,
    "UgVnt" double precision,
    "UgVir" double precision,
    "UgVntKrypton" double precision,
    "UgVirKrypton" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieUg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieUjn; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieUjn" (
    "idUjn" integer NOT NULL,
    "idFermeture" integer,
    "Uw" double precision,
    "Ujn" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieUjn" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieUw; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieUw" (
    "idUw" integer NOT NULL,
    "idParoiVitree" integer,
    "Ug" double precision,
    "Uw" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieUw" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieVitrage" (
    "idVitrage" integer NOT NULL,
    libelle character varying(50),
    "Ug" double precision,
    "Uw" double precision,
    "Fts" double precision,
    "keyVitrage" character varying(50),
    "tvWB" character varying(10),
    "tvWB_W" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereBaieW; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereBaieW" (
    idw integer NOT NULL,
    "idParoiVitree" integer,
    "keyVitrage" character varying(50),
    "isVir" boolean,
    "isNu" boolean,
    "W" double precision,
    "tvWB_W" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereBaieW" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCORPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCORPlafond" (
    "idEnumerCORPlafond" integer NOT NULL,
    "keyCORPlafond" character varying(5) NOT NULL,
    "typePlafond" character varying(30) NOT NULL,
    "CORplafond" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCORPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCORmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCORmur" (
    "idEnumereCORmur" integer NOT NULL,
    "keyCORmur" character varying(5) NOT NULL,
    "libelleCORmur" character varying(30) NOT NULL,
    "CORmur" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCORmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCORsol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCORsol" (
    "idEnumereCORsol" integer NOT NULL,
    "keyCORsol" character varying(5) NOT NULL,
    "typeSol" character varying(50) NOT NULL,
    "CORsol" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCORsol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCaracteristiqueGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCaracteristiqueGenerateur" (
    "idCarac" integer NOT NULL,
    "idGenerateur" integer,
    "idAnciennete" integer,
    "COP" double precision,
    "Rg" double precision,
    "Pn" double precision,
    "Rpn" double precision,
    "Rpn1" double precision,
    "Rpint" double precision,
    "Rpint2" double precision,
    "A" double precision,
    "Aint" double precision,
    "B" double precision,
    "Bint" double precision,
    "Qp0" double precision,
    "dQp0" double precision,
    "expQp0" double precision,
    "Pveil" double precision,
    "hasAtita" boolean,
    "hasVentilo" boolean,
    "tvWB" character varying(10),
    "tvWB_bis" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCaracteristiqueGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCef; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCef" (
    "idCef" integer NOT NULL,
    libelle character varying(50),
    "Cef" double precision,
    "Cefhors" double precision,
    "tvWB" character varying(10),
    "tvWB_Hors" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCef" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCommentaireDossier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCommentaireDossier" (
    "idEnumereCommentaireDossier" integer NOT NULL,
    "libelleCommentaire" character varying(100) NOT NULL,
    commentaire text NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCommentaireDossier" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCommentairePreconisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCommentairePreconisation" (
    "idEnumereCommentairePreconisation" integer NOT NULL,
    "libelleCommentaire" character varying(100) NOT NULL,
    commentaire text NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCommentairePreconisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereConduiteReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereConduiteReseau" (
    "idConduite" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereConduiteReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCorBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCorBaie" (
    "idEnumereCorBaie" integer NOT NULL,
    "keyCORbaie" character varying(5) NOT NULL,
    "libelleCORbaie" character varying(30),
    "CORbaie" double precision,
    "isMI" boolean NOT NULL,
    "isIC" boolean NOT NULL,
    defaut boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCorBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCr" (
    "idCr" integer NOT NULL,
    "idGenerateur" integer,
    "minVs" real,
    "maxVs" real,
    "Cr" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereCreditImpot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereCreditImpot" (
    "idEnumereCreditImpot" integer NOT NULL,
    "intituleCredit" character varying(50),
    "texteCredit" character varying(255),
    "valeurCredit" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "typeCredit" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereCreditImpot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailCORPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORPlafond" (
    "idEnumerDetailCORPlafond" integer NOT NULL,
    "idEnumereCORPlafond" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailCORmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORmur" (
    "idEnumereDetailCORmur" integer NOT NULL,
    "idEnumereCORmur" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailCORsol; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORsol" (
    "idEnumerDetailCORsol" integer NOT NULL,
    "idEnumereCORsol" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailCORsol" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailCorBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailCorBaie" (
    "idEnumereDetailCORbaie" integer NOT NULL,
    "idEnumereCorBaie" integer,
    libelle character varying(100),
    "Uvue" real,
    "isMi" boolean,
    "isIc" boolean,
    "keyDetail" character varying(5) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailCorBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailUmurD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailUmurD" (
    "idDetail" integer NOT NULL,
    "idEnumereUmurD" integer,
    "minAn" integer,
    "supAn" integer,
    "UmurD" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailUmurD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailUplafondD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailUplafondD" (
    "idDetail" integer NOT NULL,
    "idEnumereUplafondD" integer,
    "minAn" integer,
    "supAn" integer,
    "UplafondD" double precision,
    "UplafondDCombleHabites" double precision,
    "UplafondDTerrasse" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailUplafondD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDetailUplancherD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDetailUplancherD" (
    "idDetail" integer NOT NULL,
    "idEnumereUplancherD" integer,
    "minAn" integer,
    "supAn" integer,
    "UplancherD" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDetailUplancherD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDhd; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDhd" (
    "idDhd" integer NOT NULL,
    "idZoneHiver" character varying(2),
    "N" real,
    "Tmoy" real,
    "Tmin" real,
    "dX" real,
    "DH14" real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDhd" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereDistribReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereDistribReseau" (
    "idDistrib" integer NOT NULL,
    libelle character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereDistribReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEconomies; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEconomies" (
    "idEnumereEconomies" integer NOT NULL,
    "libelleEconomies" character varying(30) NOT NULL,
    "valeurEconomies" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEconomies" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEffortInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEffortInvestissement" (
    "idEnumereEffortInvestissement" integer NOT NULL,
    "libelleEffortInvestissement" character varying(30) NOT NULL,
    "valeurEffortInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEffortInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEmetteur" (
    "idEnumereEmetteur" integer NOT NULL,
    "idTypeEnergie" integer,
    "KEY_emetteur" character varying(10),
    "libelleEmetteur" character varying(150) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEmetteurIntermittence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEmetteurIntermittence" (
    "idEmet" integer NOT NULL,
    "idTypeChauffage" integer,
    libelle character varying(50),
    "isMI" boolean,
    "isICindividuel" boolean,
    "isICcollectif" boolean,
    "AvecRegul" boolean,
    "Central" boolean,
    "Divise" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEmetteurIntermittence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEpaisseurIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEpaisseurIsolant" (
    "idEnumereEpaisseurIsolant" integer NOT NULL,
    "epaisseurIsolant" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEpaisseurIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEquipementIntermittence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEquipementIntermittence" (
    "idInter" integer NOT NULL,
    libelle character varying(50),
    "isMi" boolean,
    "isICindividuel" boolean,
    "isICcollectif" boolean,
    "parPiece" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEquipementIntermittence" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereEtage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereEtage" (
    "idEnumereEtage" integer NOT NULL,
    "libelleEtage" character varying(20) NOT NULL,
    "valeurEtage" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereEtage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereFe1; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereFe1" (
    "idFe1" integer NOT NULL,
    "isFondLoggia" boolean,
    "isAuvent" boolean,
    "isLateral" boolean,
    "isRetourSud" boolean,
    "minAvancee" real,
    "maxAvancee" real,
    "minL1L2" real,
    "maxL1L2" real,
    "keyOrientation" character varying(10),
    "Fe1" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereFe1" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereFe2; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereFe2" (
    "idFe2" integer NOT NULL,
    "minAlpha" real,
    "maxAlpha" real,
    "keyOrientation" character varying(10),
    "Fe2" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereFe2" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereFicheTechnique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereFicheTechnique" (
    "idEnumeFt" integer NOT NULL,
    categorie character varying(50),
    entree character varying(255),
    "ordreCat" smallint,
    ordre smallint,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereFicheTechnique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereGenerateur" (
    "idGenerateur" integer NOT NULL,
    "idTypeEnergie" integer,
    libelle character varying(100),
    "Rg" double precision,
    "Rr" double precision,
    "RrRegTermi" double precision,
    "RrRobinetThermo" double precision,
    "Rs" double precision,
    "isEffetJoule" boolean,
    "hasEmetteur" boolean,
    "isIndividuel" boolean,
    "isMi" boolean,
    "isIC" boolean,
    "notApart" boolean,
    "isDivise" boolean,
    "idTypeEmetteur" integer,
    "isECS" boolean,
    "isChauffage" boolean,
    "isChaudiere" boolean,
    "isChaudiereBT" boolean,
    "isChaudiereC" boolean,
    "isChaudiereSt" boolean,
    "isPAC" boolean,
    "isInsert" boolean,
    "isRadiateurGaz" boolean,
    "isAirChaud" boolean,
    "isBijonction" boolean,
    "isPoelBois" boolean,
    "isAcuGaz" boolean,
    "isChauffeBain" boolean,
    "isChauffeEauThermo" boolean,
    "isBallonElec" boolean,
    "COPextrait" double precision,
    "COPexterieur" double precision,
    "keyRd" character varying(5),
    "notRecommandable" boolean NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereGroupeRecommandation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereGroupeRecommandation" (
    "idGroupeRecommandation" integer NOT NULL,
    "LibelleGroupe" character varying(255),
    "EffortInvestMaxPlage1" integer,
    "EffortInvestMaxPlage2" integer,
    "EffortInvestMaxPlage3" integer,
    "EffortInvestMaxPlage4" integer,
    "EffortInvestMaxPlage5" integer,
    "PictogrammeEffortInvest" bytea,
    "EconomiesMaxPlage1" integer,
    "EconomiesMaxPlage2" integer,
    "EconomiesMaxPlage3" integer,
    "EconomiesMaxPlage4" integer,
    "EconomiesMaxPlage5" integer,
    "PictogrammeEconomies" bytea,
    "RetourInvestMaxPlage1" integer,
    "RetourInvestMaxPlage2" integer,
    "RetourInvestMaxPlage3" integer,
    "RetourInvestMaxPlage4" integer,
    "RetourInvestMaxPlage5" integer,
    "PictogrammeRetourInvest" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSdl" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereGroupeRecommandation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereI0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereI0" (
    "idIzero" integer NOT NULL,
    "idInter" integer,
    "keyEmet" character varying(5),
    intertie character varying(50),
    "isCentral" boolean,
    "isDivise" boolean,
    "hasComptage" boolean,
    "hasRegul" boolean,
    "I0" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereI0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereIauxClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereIauxClimatisation" (
    "idEnumereIauxClimatisation" integer NOT NULL,
    "libelleClim" character varying(50),
    "C" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereIauxClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereId; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereId" (
    "idEnumereId" integer NOT NULL,
    "idEnumereApplicationRecommandation" integer,
    id integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereId" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereInclinaisonC1; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereInclinaisonC1" (
    "idC" integer NOT NULL,
    "idInclinaison" integer,
    "keyOrientation" character varying(10),
    "C1" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereInclinaisonC1" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereInclinaisonParoi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereInclinaisonParoi" (
    "idInclinaison" integer NOT NULL,
    inclinaison character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereInclinaisonParoi" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereInertie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereInertie" (
    "idInertie" integer NOT NULL,
    "PbLourd" boolean,
    "PhLourd" boolean,
    "PvLourd" boolean,
    "keyInertie" character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereInertie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereInstalltionChauffage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereInstalltionChauffage" (
    "idInstallation" integer NOT NULL,
    type character varying(255),
    "isMi" boolean,
    "isIC" boolean,
    "keyInstall" integer,
    "tvWB" character varying(10),
    "infoInstall" text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereInstalltionChauffage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereIsolant" (
    "idEnumereIsolant" integer NOT NULL,
    "libelleIsolant" character varying(50) NOT NULL,
    classe character varying(15) NOT NULL,
    lambda real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereLameAir; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereLameAir" (
    "idEnumereLameAir" integer NOT NULL,
    "libelleLameAir" character varying(30) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereLameAir" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereLargeurDormant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereLargeurDormant" (
    "idLp" integer NOT NULL,
    lp real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereLargeurDormant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereLineaireFenetreMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereLineaireFenetreMur" (
    "idLineaire" integer NOT NULL,
    "keyLineique" character varying(50),
    "MurNonIso" boolean,
    "MurIti" boolean,
    "MurIte" boolean,
    "isRetourIso" boolean,
    "MurItr" boolean,
    "MurItiIte" boolean,
    "MurItiItr" boolean,
    "MurIteItr" boolean,
    "isNu" integer,
    "idLp" integer,
    k double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereLineaireFenetreMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereLineaireGeneral; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereLineaireGeneral" (
    "idLineaire" integer NOT NULL,
    "keyLineique" character varying(50),
    "P1nonIso" boolean,
    "P1iti" boolean,
    "P1ite" boolean,
    "P1itr" boolean,
    "P1itiite" boolean,
    "P1itiitr" boolean,
    "P1iteitr" boolean,
    "P2nonIso" boolean,
    "P2iti" boolean,
    "P2ite" boolean,
    "P2itiite" boolean,
    k double precision,
    "isTerrasse" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereLineaireGeneral" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereMIT; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereMIT" (
    "idEnumereMIT" integer NOT NULL,
    "descriptionMIT" character varying(50) NOT NULL,
    "MIT" double precision NOT NULL,
    "MIT2a" double precision NOT NULL,
    "MIT2b" double precision NOT NULL,
    "MIT2c" double precision NOT NULL,
    "imageDesc" bytea,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereMIT" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereOmb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereOmb" (
    "idOmb" integer NOT NULL,
    "keyOrientation" character varying(10),
    "minAlpha" real,
    "maxAlpha" real,
    "secteurLateral" boolean,
    "secteurCentral" boolean,
    "isSud" boolean,
    "Omb" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereOmb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePerteRecup; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePerteRecup" (
    "idPerte" integer NOT NULL,
    zone character varying(5),
    "isCollectif" boolean,
    "isInstantane" boolean,
    "keySyst" character varying(5),
    "Pr" double precision,
    "Prs" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePerteRecup" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePlageAltitude; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePlageAltitude" (
    "idEnumerePlageAltitude" integer NOT NULL,
    "libelleClasse" character varying(15) NOT NULL,
    "valeurClasse" integer NOT NULL,
    "minAltitude" integer,
    "maxAltitude" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePlageAltitude" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePnIndividuel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePnIndividuel" (
    "idPn" integer NOT NULL,
    "PdimMin" real,
    "PdimMax" real,
    "PnAvt2006" double precision,
    "PnApr2006" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePnIndividuel" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePositionBaieLoggia; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePositionBaieLoggia" (
    "idPosition" integer NOT NULL,
    "position" character varying(50),
    f real,
    "isFond" boolean,
    "keyOrientation" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePositionBaieLoggia" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePositionOrientationParoi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePositionOrientationParoi" (
    "idPosition" integer NOT NULL,
    "position" character varying(50),
    "keyOrientation" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePositionOrientationParoi" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumerePr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumerePr" (
    "idPrs" integer NOT NULL,
    "isECS" boolean,
    "isInd" boolean,
    "isChauffeBain" boolean,
    "isChaudiereMixte" boolean,
    "hasBallonIn" boolean,
    "PrH1" double precision,
    "PrH2" double precision,
    "PrH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumerePr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereRegulPAC; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereRegulPAC" (
    "idRegul" integer NOT NULL,
    "idGenerateur" integer,
    "idTypeRegulation" integer,
    "CregulPlancher" double precision,
    "CregulAutre" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereRegulPAC" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereRendementDistributionECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereRendementDistributionECS" (
    "idRd" integer NOT NULL,
    libelle character varying(50),
    "Rdecs" double precision,
    "prodVolHab" boolean,
    "PieceAlimContigu" boolean,
    "reseauIsole" boolean,
    "isCol" boolean,
    "isInd" boolean,
    "keyRd" character varying(5),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereRendementDistributionECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereReseauDistribution; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereReseauDistribution" (
    "idEnumereReseauDistribution" integer NOT NULL,
    "KEY_reseauDistribution" character varying(10) NOT NULL,
    "libelleReseauDistribution" character varying(100) NOT NULL,
    "Rd" double precision NOT NULL,
    "isMi" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereReseauDistribution" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereRetourInvestissement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereRetourInvestissement" (
    "idEnumereRetourInvestissement" integer NOT NULL,
    "libelleRetourInvestissement" character varying(30) NOT NULL,
    "valeurRetourInvestissement" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereRetourInvestissement" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereRpnRadiateurGaz; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereRpnRadiateurGaz" (
    "idRpn" integer NOT NULL,
    "idCarac" integer,
    "hasVentilo" boolean,
    fmaj double precision,
    "Rpn" double precision,
    "Rpn1" double precision,
    "A" double precision,
    "B" double precision,
    "A1" double precision,
    "B1" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereRpnRadiateurGaz" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereRsRgReseau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereRsRgReseau" (
    "idRsRg" integer NOT NULL,
    "RsRg" double precision,
    "isIso" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereRsRgReseau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereSystemeClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereSystemeClimatisation" (
    "idEnumereSystemeClimatisation" integer NOT NULL,
    "idTypeEnergie" integer,
    "KeySystClim" character varying(10) NOT NULL,
    "libelleSystemeClim" character varying(30) NOT NULL,
    "systGaz" boolean NOT NULL,
    "systElectrique" boolean NOT NULL,
    "systCollectif" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereSystemeClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTch; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTch" (
    "idTCH" integer NOT NULL,
    min real,
    max real,
    "Tch" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTch" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbBaieUg; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbBaieUg" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "keyVitrage" character varying(50),
    "isVertical" boolean,
    "isKrypton" boolean,
    epaisseur real,
    "isVIR" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbBaieUg" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbBecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbBecs" (
    "idtvWB" integer NOT NULL,
    "isImm" boolean,
    "minS" real,
    "maxS" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbBecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbCatERP; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCatERP" (
    "idtvWB" integer NOT NULL,
    categorie character varying(50),
    groupe character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCatERP" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbConstante; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbConstante" (
    "idtvWB" integer NOT NULL,
    "table" character varying(50),
    code character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbConstante" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbCr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCr" (
    "idtvWB" integer NOT NULL,
    "isHorizontal" boolean,
    "isVsup75" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbCregul; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCregul" (
    "idtvWB" integer NOT NULL,
    "isPlancher" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbCregul" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbEuroRecommendation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbEuroRecommendation" (
    "idtvWB" integer NOT NULL,
    type character varying(50),
    "isEffort" boolean,
    "isEconomie" boolean,
    "isRetour" boolean,
    min real,
    max real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbEuroRecommendation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbFecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbFecs" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    dpt character varying(2) NOT NULL,
    "isIC" boolean,
    "hasSolCh" boolean,
    "isEcsVieux" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbFecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbFuiteVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbFuiteVentilation" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "aRaEt" boolean,
    "aRaOu" boolean,
    "aRa" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbFuiteVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbInstallationEcs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbInstallationEcs" (
    "idtvWB" integer NOT NULL,
    "isUniqueAvecSol" boolean,
    "isUniqueSansSol" boolean,
    "isDoubleMI_IC" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbInstallationEcs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbKeyUsage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbKeyUsage" (
    "idtvWB" integer NOT NULL,
    type character varying(35),
    "keyUsage" integer,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbKeyUsage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbPciCo2; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPciCo2" (
    "idtvWB" integer NOT NULL,
    "idTypeEnergie" integer,
    "isENR" boolean,
    "is3CL" boolean,
    "keyUsage" integer,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPciCo2" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbPdim; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPdim" (
    "idtvWB" integer NOT NULL,
    "isMural" boolean,
    "isAvt2006" boolean,
    "minPdim" real,
    "maxPdim" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPdim" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbPecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPecs" (
    "idtvWB" integer NOT NULL,
    "minVs" real,
    "maxVs" real,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbPrs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPrs" (
    "idtvWB" integer NOT NULL,
    "idPrs" integer,
    "tvWB" character varying(10),
    "Hi" character varying(2),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbPrs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbQgw; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbQgw" (
    "idtvWB" integer NOT NULL,
    "isBelec" boolean,
    "isBaccu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbQgw" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbRgECS; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRgECS" (
    "idtvWB" integer NOT NULL,
    "isElec" boolean,
    "isChaudiere" boolean,
    "isMixte" boolean,
    "isAccuGaz" boolean,
    "isChBainInstantanne" boolean,
    "isThermo" boolean,
    "hasAppoint" boolean,
    "isRescha" boolean,
    "isIsole" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRgECS" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbRr; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRr" (
    "idtvWB" integer NOT NULL,
    "idGenerateur" integer,
    "idTypeEmetteur" integer,
    "hasRegul" boolean,
    "isIndividuel" boolean,
    "hasRobinetTh" boolean,
    "isApartCombustion" boolean,
    "isAutreCas" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRr" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbRsecs; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRsecs" (
    "idtvWB" integer NOT NULL,
    "hasAccu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbRsecs" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbTfonc; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTfonc" (
    "idtvWB" integer NOT NULL,
    "isT100" boolean,
    "typeChaudiere" character varying(2),
    "idAnciennete" integer,
    "idAncEmet" integer,
    "kT" character varying(1),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTfonc" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbTypeDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeDPE" (
    "idtvWB" integer NOT NULL,
    "idTypeDossierDPE" character varying(5),
    "tvWB" character varying(10),
    type character varying(20),
    modele character varying(20),
    "is3CL" boolean,
    "isFacture" boolean,
    "isUsage" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbTypeDescriptif; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeDescriptif" (
    "idtvWB" integer NOT NULL,
    type character varying(65),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeDescriptif" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbTypeERP; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeERP" (
    "idtvWB" integer NOT NULL,
    key character varying(5),
    type character varying(150),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeERP" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbTypeParoiOpaque; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeParoiOpaque" (
    "idtvWB" integer NOT NULL,
    type character varying(50),
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbTypeParoiOpaque" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbUmur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUmur" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "idEnumereAnneeConstruction" integer,
    "idEnumereUmurD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUmur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbUpb; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUpb" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "isTpl" boolean,
    "2SP" real,
    "idEnumereAnneeConstruction" integer,
    "idEnumereUplancherD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUpb" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTvwbUph; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUph" (
    "idtvWB" integer NOT NULL,
    "tvWB" character varying(10),
    "isIsoInconnue" boolean,
    "isIso" boolean,
    "keyCORPlafond" character varying(5),
    "idEnumereAnneeConstruction" integer,
    "idEnumereUplafondD" integer,
    "zoneHiver" character varying(50),
    "isEffetJoule" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTvwbUph" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeEclairage" (
    "idEnumereTypeEclairage" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeEmetteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeEmetteur" (
    "idTypeEmetteur" integer NOT NULL,
    "typeEmetteur" character varying(50),
    "Re" double precision,
    "isElecOnly" boolean,
    "isAirChaud" boolean,
    "isPlancher" boolean,
    "isPlafond" boolean,
    "isRadiateur" boolean,
    "RrCol" double precision,
    "RrRobinetCol" double precision,
    "RrInd" double precision,
    "RrRobinetInd" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeEmetteur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeEquipementDivers" (
    "idEnumereTypeEquipementDivers" integer NOT NULL,
    description character varying(255) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeMenuiserie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeMenuiserie" (
    "idEnumereTypeMenuiserie" integer NOT NULL,
    "libelleMenuiserie" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeMenuiserie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeMur" (
    "idEnumereTypeMur" integer NOT NULL,
    "descriptionMur" character varying(255) NOT NULL,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    kpim double precision NOT NULL,
    kpibme double precision NOT NULL,
    kmen double precision NOT NULL,
    "Umur" double precision,
    "isOssatureBois" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeRegulPac; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeRegulPac" (
    "idTypeRegulation" integer NOT NULL,
    regul character varying(50),
    "isDefaut" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeRegulPac" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereTypeVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereTypeVitrage" (
    "idEnumereTypeVitrage" integer NOT NULL,
    "libelleTypeVitrage" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereTypeVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUTerrePlein; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUTerrePlein" (
    "idTp" integer NOT NULL,
    ps smallint,
    upb double precision,
    "upbPost2001" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUTerrePlein" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUfenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUfenetre" (
    "idEnumereUfenetre" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UfenetreSansVolet" real NOT NULL,
    "UfenetreAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUfenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUmur0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUmur0" (
    "idEnumereUmur0" integer NOT NULL,
    "idEnumereTypeMur" integer,
    "epaisseurMur" real,
    "Umur" double precision NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUmur0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUmurD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUmurD" (
    "idEnumereUmurD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UmurD" double precision NOT NULL,
    "UH1" double precision,
    "UH2" double precision,
    "UH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUmurD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUmurInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUmurInconnu" (
    "idEnumereUmurInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UmurH1Joule" double precision NOT NULL,
    "UmurH1Autre" double precision NOT NULL,
    "UmurH2Joule" double precision NOT NULL,
    "UmurH2Autre" double precision NOT NULL,
    "UmurH3Joule" double precision NOT NULL,
    "UmurH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUmurInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplafond0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplafond0" (
    "idEnumereUplafond0" integer NOT NULL,
    "descriptionPlafond" character varying(50) NOT NULL,
    "Uplafond0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "isOssatureBois" boolean,
    "isCblAme" boolean,
    "isCblPerdu" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplafond0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplafondD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplafondD" (
    "idEnumereUplafondD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplafondD" double precision NOT NULL,
    "UplafondDCombleHabites" double precision NOT NULL,
    "UplafondDTerrasse" double precision NOT NULL,
    "UH1cbl" double precision,
    "UH2cbl" double precision,
    "UH3cbl" double precision,
    "UH1cblAme" double precision,
    "UH2cblAme" double precision,
    "UH3cblAme" double precision,
    "UH1ter" double precision,
    "UH2ter" double precision,
    "UH3ter" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplafondD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplafondInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplafondInconnu" (
    "idEnumereUplafondInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "isTerrasse" boolean NOT NULL,
    "UplafondH1Joule" double precision NOT NULL,
    "UplafondH1Autre" double precision NOT NULL,
    "UplafondH2Joule" double precision NOT NULL,
    "UplafondH2Autre" double precision NOT NULL,
    "UplafondH3Joule" double precision NOT NULL,
    "UplafondH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplafondInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplancher0; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplancher0" (
    "idEnumereUplancher0" integer NOT NULL,
    "descriptionPlancher" character varying(50) NOT NULL,
    "keyPlancher" character varying(5) NOT NULL,
    "Uplancher0" double precision,
    "isLourd" boolean NOT NULL,
    "imageDesc" bytea,
    "isOssatureBois" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplancher0" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplancherD; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplancherD" (
    "idEnumereUplancherD" integer NOT NULL,
    "periodeIsolation" character varying(20) NOT NULL,
    "UplancherD" double precision NOT NULL,
    "UH1" double precision,
    "UH2" double precision,
    "UH3" double precision,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplancherD" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUplancherInconnu; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUplancherInconnu" (
    "idEnumereUplancherInconnu" integer NOT NULL,
    "idEnumereAnneeConstruction" integer,
    "UplancherH1Joule" double precision NOT NULL,
    "UplancherH1Autre" double precision NOT NULL,
    "UplancherH2Joule" double precision NOT NULL,
    "UplancherH2Autre" double precision NOT NULL,
    "UplancherH3Joule" double precision NOT NULL,
    "UplancherH3Autre" double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUplancherInconnu" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUporte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUporte" (
    "idEnumereUporte" integer NOT NULL,
    "idEnumereTypeMenuiserie" integer,
    "typePorte" character varying(100) NOT NULL,
    "Uporte" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUporte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereUveranda; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereUveranda" (
    "idEnumereUveranda" integer NOT NULL,
    "idEnumereLameAir" integer,
    "idEnumereTypeMenuiserie" integer,
    "idEnumereTypeVitrage" integer,
    "UverandaSansVolet" real NOT NULL,
    "UverandaAvecVolet" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereUveranda" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) enumereVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) enumereVentilation" (
    "idEnumereVentilation" integer NOT NULL,
    "idTypeVentilation" integer,
    "libelleVentilation" character varying(255) NOT NULL,
    "aRAet" double precision,
    "aRAou" double precision,
    "aRA" double precision NOT NULL,
    "Smea" double precision,
    "Qvarep" double precision,
    "isPuitClimatique" boolean,
    "isDFechangeur" boolean,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) enumereVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) ficheTechnique; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) ficheTechnique" (
    idft integer NOT NULL,
    "idSaisieLot" integer,
    categorie character varying(50),
    entree character varying(255),
    valeur text,
    "ordreCat" smallint,
    ordre smallint
);


ALTER TABLE public."(ADN_DIAG_DPE2012) ficheTechnique" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) groupementFacture; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) groupementFacture" (
    "idGroupementFacture" integer NOT NULL,
    "idTypeEnergie" integer,
    "idSaisieLot" integer,
    "idEnumereCombustible" integer,
    "libelleGroupement" character varying(100),
    "typeGroupement" character varying(50),
    "pourChauffage" boolean NOT NULL,
    "pourECS" boolean NOT NULL,
    "pourClimatisation" boolean NOT NULL,
    "ratioChauffage" double precision,
    "ratioECS" double precision,
    "ratioClimatisation" double precision,
    "isCollectif" boolean,
    millieme integer,
    "milliemeBase" integer,
    "keyUsage" integer,
    "isMethodeMixte" boolean,
    "ratioENR" double precision,
    "isRachat" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) groupementFacture" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) locQteEfImmeuble; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) locQteEfImmeuble" (
    "idLocQteEfImmeuble" integer NOT NULL,
    "idTypeEnergie" integer,
    "idMission" integer,
    "idEnumereCombustible" integer,
    "KEYusage" integer,
    "ConsoEf" double precision,
    "ratioLot" integer,
    "ratioImmeuble" integer,
    "Bch" double precision,
    depense double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) locQteEfImmeuble" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) lotBaie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) lotBaie" (
    "idBaie" integer NOT NULL,
    "idLot" integer,
    nom character varying(255),
    surface real,
    orientation smallint
);


ALTER TABLE public."(ADN_DIAG_DPE2012) lotBaie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) lotSurfaces; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) lotSurfaces" (
    "idSurfaces" integer NOT NULL,
    "idLot" integer,
    type character varying(50),
    "typeEnergie" character varying(50),
    surface real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) lotSurfaces" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) materiauThBat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) materiauThBat" (
    "idMateriauThBat" integer NOT NULL,
    "MATERIAUPARENT_idMateriauThBat" integer,
    libelle character varying(255) NOT NULL,
    rho character varying(100),
    lambda double precision,
    commentaire text,
    "isIsolant" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) materiauThBat" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) pieceSaisie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) pieceSaisie" (
    "idPieceSaisie" integer NOT NULL,
    "idSaisieLot" integer,
    "libellePiece" character varying(50) NOT NULL,
    "libelleEtage" character varying(20),
    "numeroPiece" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) pieceSaisie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationClimatisation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationClimatisation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailClimatisation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationClimatisation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationEclairage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationEclairage" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEclairage" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationEclairage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationEquipementDivers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationEquipementDivers" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEquipementDivers" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationEquipementDivers" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationFenetre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationFenetre" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationFenetre" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationGenerateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationGenerateur" (
    "idDetailPreconisation" integer NOT NULL,
    "idSaisieGenerateur" integer,
    "isECS" boolean,
    "isChauffage" boolean
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationGenerateur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationMur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationMur" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationMur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationPlafond; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationPlafond" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationPlafond" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationPlancher; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationPlancher" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationPlancher" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationPorte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationPorte" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailEnveloppe" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationPorte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationSourceEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationSourceEnergie" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailSourceEnergie" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationSourceEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) preconisationVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) preconisationVentilation" (
    "idDetailPreconisation" integer NOT NULL,
    "idDetailVentilation" integer
);


ALTER TABLE public."(ADN_DIAG_DPE2012) preconisationVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) prixEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) prixEnergie" (
    "idPrixEnergie" integer NOT NULL,
    "idEnumereCombustible" integer,
    "idTypeEnergie" integer,
    "libellePrixEnergie" character varying(100) NOT NULL,
    "prix_kWh" double precision NOT NULL,
    "datePrixEnergie" timestamp without time zone NOT NULL,
    "minConsommation" real,
    "maxConsommation" real,
    "tarifAbonnement" double precision,
    "simpleTarif" boolean NOT NULL,
    "doubleTarif" boolean,
    "tarifElecHC" double precision,
    "tarifElecHP" double precision,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) prixEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) referentNotationElementDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) referentNotationElementDPE" (
    "idReferentNotationElementDPE" integer NOT NULL,
    "KEYQuoiAmelioer" character varying(10),
    valeur1 double precision NOT NULL,
    valeur2 double precision NOT NULL,
    valeur3 double precision NOT NULL,
    valeur4 double precision NOT NULL,
    valeur5 double precision NOT NULL,
    valeur6 double precision NOT NULL,
    valeur7 double precision NOT NULL,
    valeur8 double precision NOT NULL,
    valeur9 double precision NOT NULL,
    valeur10 double precision NOT NULL,
    valeur11 double precision NOT NULL,
    valeur12 double precision NOT NULL,
    valeur13 double precision NOT NULL,
    valeur14 double precision NOT NULL,
    valeur15 double precision NOT NULL,
    valeur16 double precision NOT NULL,
    valeur17 double precision NOT NULL,
    valeur18 double precision NOT NULL,
    valeur19 double precision NOT NULL,
    valeur20 double precision NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) referentNotationElementDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) saisieIsolant; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) saisieIsolant" (
    "idSaisieIsolant" integer NOT NULL,
    "Risolant_saisie" double precision,
    "epaisseurIsolantSaisie" double precision,
    "anneeIsolationSaisie" character varying(30),
    "Ud" double precision
);


ALTER TABLE public."(ADN_DIAG_DPE2012) saisieIsolant" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) saisieLot; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) saisieLot" (
    "idSaisieLot" integer NOT NULL,
    "idEnumereEffortInvestissement" integer,
    "RELETATINITETATPROJ_idSaisieLot" integer,
    "idAbonnementEnergie" integer,
    "idEnumereRetourInvestissement" integer,
    "idMission" integer,
    "idEnumereEconomies" integer,
    "RELDTLCALCUL_idSaisieLot" integer,
    "libelleSaisieLot" character varying(255),
    consommation double precision,
    "effortInvestissement" integer,
    "retourInvestissement" integer,
    economies integer,
    "pourcentageCreditImpot" double precision,
    "isGenerer" boolean NOT NULL,
    "isActionImmediate" boolean NOT NULL,
    "isVirtuel" boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) saisieLot" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) saisieVitrage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) saisieVitrage" (
    "idSaisieVitrage" integer NOT NULL,
    "epaisseurLameAir" character varying(20),
    argon boolean NOT NULL,
    volet boolean NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) saisieVitrage" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) surfaceDeperditive; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) surfaceDeperditive" (
    "idSurfaceDeperditive" integer NOT NULL,
    "idDetailEnveloppe" integer,
    "idCotePiece" integer,
    "surfaceSaisie" double precision NOT NULL
);


ALTER TABLE public."(ADN_DIAG_DPE2012) surfaceDeperditive" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) typeDossierDPE; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) typeDossierDPE" (
    "idTypeDossierDPE" character varying(5) NOT NULL,
    "idClasseConsommationEnergie" integer NOT NULL,
    "idClasseEmissionGES" integer NOT NULL,
    "libelleTypeDossierDPE" character varying(255) NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) typeDossierDPE" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) typeEnergie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) typeEnergie" (
    "idTypeEnergie" integer NOT NULL,
    "KEYenergie" character varying(10),
    "libelleEnergie" character varying(30) NOT NULL,
    "alphaPCSI" real NOT NULL,
    "coeffEP" real NOT NULL,
    "tvWB" character varying(10),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) typeEnergie" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) typeNiveau; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) typeNiveau" (
    "idTypeNiveau" integer NOT NULL,
    "libelleNiveau" character varying(30) NOT NULL,
    "NIV" double precision NOT NULL,
    "comblesHabite" boolean NOT NULL,
    "Cniv" smallint NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) typeNiveau" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) typeVentilation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) typeVentilation" (
    "idTypeVentilation" integer NOT NULL,
    "typeVentilation" character varying(4) NOT NULL,
    "IauxVentIC" real NOT NULL,
    "IauxVentMIcentral" real NOT NULL,
    "IauxVentMIdivise" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) typeVentilation" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) versionServeur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) versionServeur" (
    "numeroVersion" real
);


ALTER TABLE public."(ADN_DIAG_DPE2012) versionServeur" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) zoneEte; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) zoneEte" (
    "idZoneEte" character varying(2) NOT NULL,
    "RclimMI1" real NOT NULL,
    "RclimMI2" real NOT NULL,
    "RclimIC1" real NOT NULL,
    "RclimIC2" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) zoneEte" OWNER TO webadmin2;

--
-- Name: (ADN_DIAG_DPE2012) zoneHiver; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_DIAG_DPE2012) zoneHiver" (
    "idZoneHiver" character varying(2) NOT NULL,
    "Tef" real NOT NULL,
    "CoeffCOMPL" real NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_DIAG_DPE2012) zoneHiver" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Bien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Bien" (
    "idBien" integer NOT NULL,
    "discBien" character varying(1) NOT NULL,
    "idSite" integer,
    "idBatiment" integer,
    "idLotParent" integer,
    code character varying(100),
    "codeICS" character varying(255),
    "typeProprieteBatiment" character varying(10),
    usage character varying(10),
    "isBati" boolean NOT NULL,
    "articleNature" character varying(50),
    nature character varying(50),
    nom character varying(100),
    ordre integer,
    "numeroLot" character varying(50),
    niveau real,
    etage character varying(50),
    "sectionCadastrale" character varying(50),
    parcelle character varying(50),
    "anneeConstruction" character varying(50),
    "anneePermisConstruire" character varying(50),
    batiment character varying(100),
    escalier character varying(100),
    porte character varying(100),
    surface real,
    "nbLocaux" integer,
    "nbNiveaux" integer,
    "quotePart" integer,
    "quotePartTotale" integer,
    digicode character varying(50),
    "categorieRAAA" integer,
    "isMitoyen" boolean NOT NULL,
    "isIOP" boolean NOT NULL,
    "isERP" boolean NOT NULL,
    "typeERP" character varying(5),
    "catERP" integer,
    "isIGH" integer NOT NULL,
    "isAlimGazVille" boolean NOT NULL,
    "isChauffageCollectif" boolean NOT NULL,
    "isEcsCollectif" boolean NOT NULL,
    "inclureNomDansAdresse" boolean NOT NULL,
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "IdUserCre" integer,
    "idUserMaj" integer,
    "idUserSup" integer,
    commentaire text,
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "titrePhoto" character varying(50),
    "idSdl" integer,
    "ChangeTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "numPermisConstruire" character varying(50),
    "isPermisGroupe" boolean NOT NULL,
    "anneeRehabilitation" character varying(50),
    latitude numeric(18,15),
    longitude numeric(18,15),
    "idFiscal" character varying(100),
    "categorieBien" character varying(5),
    poids double precision,
    largeur double precision,
    longueur double precision,
    hauteur double precision,
    constructeur character varying(255),
    volume double precision,
    "uniteVolume" character varying(10),
    "numCopro" character varying(100),
    "usageAnterieur" character varying(10),
    "idExterne" character varying(50),
    "idA360" integer,
    historique text,
    "hspMoy" real,
    "surfacePC" real,
    "idBatimentRnb" character varying(255),
    "RPLSbien" character varying(50)
);


ALTER TABLE public."(ADN_RG)Bien" OWNER TO webadmin2;

--
-- Name: (ADN_RG)BienParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)BienParam" (
    "idParam" integer NOT NULL,
    "defautDescBatHabPP" character varying(225),
    "defautDescBatAutre" character varying(225),
    "defautDescNBatAutre" character varying(225),
    "defautDescBatLotHabPP" character varying(225),
    "defautDescNBatLotAutre" character varying(225),
    "defautDescDependance" character varying(225),
    "formatCodeSite" character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)BienParam" OWNER TO webadmin2;

--
-- Name: (ADN_RG)CadrePrestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)CadrePrestation" (
    "IdCadrePrestation" character varying(10) NOT NULL,
    "idSecteurActivite" character varying(10) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isPerso" boolean NOT NULL,
    "dateFin" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)CadrePrestation" OWNER TO webadmin2;

--
-- Name: (ADN_RG)CategoriePrestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)CategoriePrestation" (
    "idCategoriePrestation" character varying(50) NOT NULL,
    "idSecteurActivite" character varying(10),
    intitule character varying(255),
    "intituleCourt" character varying(20),
    "suffixeRefRapport" character varying(50),
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isPerso" boolean NOT NULL,
    "dateFin" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)CategoriePrestation" OWNER TO webadmin2;

--
-- Name: (ADN_RG)CategorieRdv; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)CategorieRdv" (
    "idCategorieRdv" integer NOT NULL,
    "idSecteurActivite" character varying(10),
    intitule character varying(255),
    "couleurRGB" integer,
    "dureeRdvMinute" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "WebSyncMode" character varying(10)
);


ALTER TABLE public."(ADN_RG)CategorieRdv" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Competence; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Competence" (
    "idEmploye" integer NOT NULL,
    "idCategoriePrestation" character varying(50) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Competence" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Compteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Compteur" (
    "idSociete" character varying(50) NOT NULL,
    "idCompteur" character varying(10) NOT NULL,
    valeur integer NOT NULL
);


ALTER TABLE public."(ADN_RG)Compteur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Contact; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Contact" (
    "idContact" integer NOT NULL,
    "idInterlocuteur" integer,
    fonction character varying(100),
    "titreContact" character varying(50),
    "nomContact" character varying(50),
    "prenomContact" character varying(50),
    "telephoneFixe" character varying(50),
    "telephoneIP" character varying(50),
    "telephonePortable" character varying(50),
    email character varying(50),
    fax character varying(50),
    "isDefaut" boolean NOT NULL,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "dateFin" timestamp without time zone,
    "idMigrationInterlocuteur" integer
);


ALTER TABLE public."(ADN_RG)Contact" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Contrat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Contrat" (
    "idContrat" integer NOT NULL,
    "idInterlocuteur" integer NOT NULL,
    "idSiteGestion" character varying(50),
    "idSite" integer,
    numero integer,
    reference character varying(300),
    "referenceExt" character varying(300),
    "dateDebutContrat" timestamp without time zone,
    "dateFinContrat" timestamp without time zone,
    intitule character varying(300),
    programme text,
    commentaire text,
    "InsertTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "idUserCre" integer,
    "idUserMaj" integer,
    "idUserDesactivation" integer,
    "dateDesactivation" timestamp without time zone,
    "idEmployeGestion" integer,
    "dateSignature" timestamp without time zone,
    "dateAvenant" timestamp without time zone,
    "idSociete" character varying(50) NOT NULL,
    "numeroSociete" integer,
    "isModeleSpecific" boolean NOT NULL,
    "codeExtDiag" character varying(300),
    "isClientProp" boolean NOT NULL,
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_RG)Contrat" OWNER TO webadmin2;

--
-- Name: (ADN_RG)DbParam; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)DbParam" (
    "idBase" integer NOT NULL,
    "userNotificationDelay" integer,
    "imagePreviewMaxWidth" integer,
    "imagePreviewMaxHeight" integer,
    "imagePreviewMaxSize" integer,
    "imageMaxWidth" integer,
    "imageMaxHeight" integer,
    "imageMaxSize" integer,
    "DBStructureVersion" integer,
    "DBDataVersion" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "DBMajorVersion" integer
);


ALTER TABLE public."(ADN_RG)DbParam" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Document; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Document" (
    "idDocument" integer NOT NULL,
    "idTypeDocument" integer,
    "DiscDocument" character varying(50),
    "idEmploye" integer,
    "idSociete" character varying(50),
    "idInterlocuteur" integer,
    "idResDocument" uuid,
    "titreDocument" character varying(255),
    "previewDataDocument" bytea,
    numero character varying(100),
    organisme character varying(255),
    date timestamp without time zone,
    "dateExpiration" timestamp without time zone,
    commentaire text,
    "dateFin" timestamp without time zone,
    ordre integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idMachinePlomb" integer,
    "idMachineIFT" integer,
    "isUseDateParMission" boolean NOT NULL,
    numero2 character varying(100),
    date2 timestamp without time zone,
    "dateExpiration2" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Document" OWNER TO webadmin2;

--
-- Name: (ADN_RG)DomaineActivite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)DomaineActivite" (
    "idDomaine" character varying(10) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)DomaineActivite" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Droit; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Droit" (
    "idDroit" integer NOT NULL,
    produit character varying(10),
    "zoneProduit" character varying(50),
    description character varying(200),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "restrictionNomade" boolean NOT NULL,
    "zoneModule" character varying(50),
    "typeDroit" character varying(1) NOT NULL,
    "defaultValue" boolean NOT NULL
);


ALTER TABLE public."(ADN_RG)Droit" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Employe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Employe" (
    "idEmploye" integer NOT NULL,
    "idSociete" character varying(50) NOT NULL,
    "idService" integer,
    "discService" character varying(5),
    "idFonction" integer,
    "discFonction" character varying(5),
    "isIntervenant" boolean NOT NULL,
    "isResponsable" boolean NOT NULL,
    titre character varying(50),
    nom character varying(100),
    prenom character varying(50),
    "numeroFixe" character varying(50),
    "numeroPortable" character varying(50),
    "numeroFax" character varying(50),
    mail character varying(255),
    "idResSignature" uuid,
    "titreSignature" character varying(255),
    "previewDataSignature" bytea,
    "cleSignature" bytea,
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "numeroProFixe" character varying(50),
    "numeroProPort" character varying(50),
    "numeroProIp" character varying(50),
    "numeroProFax" character varying(50),
    "mailPro" character varying(50),
    adresse1 character varying(255),
    adresse2 character varying(255),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "idResPhoto" uuid,
    "previewDataPhoto" bytea,
    "couleurRdvHexa" character varying(10),
    "couleurRdvRGB" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isCommercial" boolean NOT NULL,
    "loginAdeme" character varying(255),
    "mdpAdeme" character varying(255),
    matricule character varying(255),
    "IdSiege" character varying(50) NOT NULL,
    "loginAdemeAudit" character varying(255),
    "mdpAdemeAudit" character varying(255),
    "isBet" boolean,
    "numQualifBet" character varying(255),
    "numSiretBet" character varying(255),
    "isArchi" boolean,
    "numMatriculeArchi" character varying(255),
    "numSiretArchi" character varying(255),
    "idExterne" character varying(50),
    "idResQRcode" uuid,
    "previewDataQRcode" bytea,
    "resTypeQRcode" character varying(50)
);


ALTER TABLE public."(ADN_RG)Employe" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumDescriptifBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumDescriptifBien" (
    "idDescriptif" integer NOT NULL,
    intitule character varying(255),
    "isBatiment" boolean,
    "isPartieBatiment" boolean,
    usage character varying(10),
    "PP" boolean,
    "PC" boolean,
    "isBati" boolean NOT NULL,
    "isDependance" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "categorieBien" character varying(5)
);


ALTER TABLE public."(ADN_RG)EnumDescriptifBien" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumEtage; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumEtage" (
    "idEtage" integer NOT NULL,
    intitule character varying(50),
    "intituleAbrege" character varying(15),
    niveau real,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "categorieBien" character varying(5)
);


ALTER TABLE public."(ADN_RG)EnumEtage" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumFAI; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumFAI" (
    "idFAI" integer NOT NULL,
    nom character varying(255),
    "serveurSmtp" character varying(255),
    "portSmtp" integer,
    "isSSL" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)EnumFAI" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumFamQualite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumFamQualite" (
    "idFamQualite" character varying(10) NOT NULL,
    intitule character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)EnumFamQualite" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumLdcBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumLdcBien" (
    "idEnumLdcBien" integer NOT NULL,
    "discLdc" character varying(10) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)EnumLdcBien" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumLoi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumLoi" (
    "idLoi" integer NOT NULL,
    "idCategorieMission" character varying(50),
    intitule character varying(255),
    "texteLoi" text,
    "isObsolete" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "texteLoiRtf" text
);


ALTER TABLE public."(ADN_RG)EnumLoi" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumTypeRapport; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumTypeRapport" (
    "idTypeRapport" integer NOT NULL,
    "productCode" character varying(50),
    "reportType" character varying(50),
    "reportSubType" character varying(255),
    "idCategorieMission" character varying(50),
    "idTypeMission" character varying(50),
    "idCadreMission" character varying(50),
    intitule character varying(255),
    "titreRapport" character varying(255),
    "isConcerneMI" boolean,
    "isConcerneIC" boolean,
    "isConcernePP" boolean,
    "isConcernePC" boolean,
    "isConcerneHAB" boolean,
    "isConcerneTER" boolean,
    "isConcerneERP" boolean,
    "conditionReperage" text,
    note text,
    "dureeValiditeMois" integer,
    "texteLoi" text,
    "idLoi" integer,
    "isRapportMission" boolean,
    "isPublier" boolean,
    "isSigner" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isSelectionDefaut" boolean NOT NULL,
    "isEnrPDFNomade" boolean NOT NULL,
    "isEnrPDF" boolean NOT NULL,
    "idNorme" integer,
    "ecartDefaut" text,
    "isAPO" boolean NOT NULL,
    "isAPOGeneration" boolean NOT NULL,
    "dateFin" timestamp without time zone,
    "idModelePerso" uuid,
    "idContrat" integer,
    "isBati" boolean NOT NULL,
    "isConcerneRoute" boolean,
    "categorieBien" character varying(5),
    "customFileFormat" text,
    "typeRapportExt" character varying(100),
    "idInterlocuteur" integer,
    "typeRapport" character varying(100),
    "isVisible" boolean NOT NULL
);


ALTER TABLE public."(ADN_RG)EnumTypeRapport" OWNER TO webadmin2;

--
-- Name: (ADN_RG)EnumVille; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)EnumVille" (
    "idVille" integer NOT NULL,
    "Commune" character varying(255),
    "Codepos" double precision,
    "Departement" character varying(255),
    "INSEE" double precision,
    "idPays" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)EnumVille" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Fonction; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Fonction" (
    "idFonction" integer NOT NULL,
    "discFonction" character varying(5),
    "idService" integer,
    "discService" character varying(5),
    intitule character varying(255),
    "isVerrou" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Fonction" OWNER TO webadmin2;

--
-- Name: (ADN_RG)GroupeUtilisateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)GroupeUtilisateur" (
    "idGroupeUtilisateur" character varying(10) NOT NULL,
    nom character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)GroupeUtilisateur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Interlocuteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Interlocuteur" (
    "idInterlocuteur" integer NOT NULL,
    "idSiteGestion" character varying(50),
    "catInterlocuteur" integer NOT NULL,
    code character varying(10),
    "codeICS" character varying(255),
    "typePersonne" character varying(1),
    "idQualite" integer,
    titre character varying(50),
    nom character varying(100),
    prenom character varying(50),
    adresse1 character varying(255),
    adresse2 character varying(255),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    "idPays" integer,
    "telephoneFixe" character varying(50),
    "telephoneIP" character varying(50),
    "telephoneMobile" character varying(50),
    fax character varying(50),
    email character varying(255),
    "siteWeb" character varying(255),
    "txComDefaut" double precision,
    commentaire text,
    origine character varying(100),
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "IdUserCre" integer,
    "idUserMaj" integer,
    "idUserSup" integer,
    "idOrigine" integer,
    "detailOrigine" character varying(255),
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idPub" integer,
    "datePub" timestamp without time zone,
    "statusPub" integer NOT NULL,
    "migratedData" boolean,
    "idResponsable" integer,
    "isSync" boolean NOT NULL,
    "isInactif" boolean NOT NULL,
    "numAccreditation" character varying(100),
    "heurePMDebut" timestamp without time zone,
    "heurePMFin" timestamp without time zone,
    "heureAMDebut" timestamp without time zone,
    "heureAMFin" timestamp without time zone,
    "discWebLabo" character varying(10),
    "codExt" character varying(100),
    "idSociete" character varying(50) NOT NULL,
    "isMailLabo" boolean NOT NULL,
    "idGestionnaire" integer,
    "idDocumentAccreditation" integer,
    "codeExtDiag" character varying(300),
    "infoBAN" text,
    "isFactureHT" boolean NOT NULL,
    "idExterne" character varying(50),
    "idCompteWebA360" integer,
    "RPLS" character varying(50),
    siret character varying(50),
    "idCertifAdeme" integer,
    "codeCertifAdeme" character varying(50),
    "nomCertifAdeme" character varying(500)
);


ALTER TABLE public."(ADN_RG)Interlocuteur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)MDI_EnqueteExclusion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)MDI_EnqueteExclusion" (
    "idEnqueteExclusion" integer NOT NULL,
    "idContact" integer,
    "idInterlocuteur" integer,
    isactif boolean NOT NULL,
    email character varying(50)
);


ALTER TABLE public."(ADN_RG)MDI_EnqueteExclusion" OWNER TO webadmin2;

--
-- Name: (ADN_RG)MDI_EnumEnquete; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)MDI_EnumEnquete" (
    "idEnumEnquete" integer NOT NULL,
    isactif boolean NOT NULL,
    isdefaut boolean NOT NULL,
    descrip character varying(64),
    objmail character varying(128),
    fichiermail character varying(64),
    permalien character varying(250)
);


ALTER TABLE public."(ADN_RG)MDI_EnumEnquete" OWNER TO webadmin2;

--
-- Name: (ADN_RG)OrigineInterlocuteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)OrigineInterlocuteur" (
    "idOrigine" integer NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)OrigineInterlocuteur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamContrat; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamContrat" (
    "idParametre" integer NOT NULL,
    "idContrat" integer NOT NULL,
    zone character varying(50),
    intitule character varying(255),
    valeur text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)ParamContrat" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamGeneric; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamGeneric" (
    "idParametre" integer NOT NULL,
    zone character varying(50),
    intitule character varying(255),
    valeur text,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)ParamGeneric" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamLog; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamLog" (
    "tableName" character varying(100) NOT NULL,
    date timestamp without time zone,
    "SentAnchor" bytea,
    "ReceivedAnchor" bytea
);


ALTER TABLE public."(ADN_RG)ParamLog" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamMailModele; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamMailModele" (
    "idModele" integer NOT NULL,
    "productCode" character varying(50),
    titre character varying(255),
    texte text,
    "isDefaut" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    intitule character varying(255),
    "dscModele" character varying(10)
);


ALTER TABLE public."(ADN_RG)ParamMailModele" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamMailing; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamMailing" (
    "idParamMailing" integer NOT NULL,
    "adresseMail" character varying(255),
    "nomFAI" character varying(255),
    "serveurSmtp" character varying(255),
    "Port" integer,
    "idMessagerie" character varying(255),
    "mdpMessagerie" character varying(255),
    "isAuthentificationSSL" boolean,
    "isDefautAccount" boolean,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)ParamMailing" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamSync; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamSync" (
    "idServer" uuid
);


ALTER TABLE public."(ADN_RG)ParamSync" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ParamTombstone; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ParamTombstone" (
    "tableName" character varying(255),
    "rowId" character varying(50),
    "rowId2" character varying(50),
    "rowId3" character varying(50),
    "DeleteTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)ParamTombstone" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ProcessLog; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ProcessLog" (
    "idProcessLog" integer NOT NULL,
    "idProcessLogParent" integer,
    produit character varying(10),
    "typeProcess" character varying(10),
    code character varying(50),
    intitule character varying(255),
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    statut integer,
    "dateCreation" timestamp without time zone,
    "idUserCreation" integer,
    "dateMaj" timestamp without time zone,
    "processConfigData" text,
    "processConfigVersion" character varying(10),
    "errorLog" text,
    "customField1" text,
    "customField2" text,
    "customField3" text
);


ALTER TABLE public."(ADN_RG)ProcessLog" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ProcessLogItem; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ProcessLogItem" (
    "idProcessLogItem" integer NOT NULL,
    "idProcessLog" integer NOT NULL,
    "itemSourceId" integer,
    "itemSourceName" character varying(255),
    "itemCibleId" integer,
    "itemCibleName" character varying(255),
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    statut integer,
    "errorLog" text,
    "customField1" text,
    "customField2" text,
    "customField3" text
);


ALTER TABLE public."(ADN_RG)ProcessLogItem" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Qualite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Qualite" (
    "idQualite" integer NOT NULL,
    "idFamQualite" character varying(10),
    "typePersonne" character varying(1),
    "libelleQualite" character varying(100),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Qualite" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Rdv; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Rdv" (
    "idRdv" integer NOT NULL,
    "idEmploye" integer,
    "idCategorieRdv" integer NOT NULL,
    sujet character varying(512),
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    description text,
    "typeLien" character varying(10),
    recurrence text,
    "isVerrou" boolean NOT NULL,
    "idSdl" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idInterlocuteur" integer,
    "idBien" integer,
    adresse character varying(255)
);


ALTER TABLE public."(ADN_RG)Rdv" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RelDocument_CatPrestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RelDocument_CatPrestation" (
    "idDocument" integer NOT NULL,
    "idCategoriePrestation" character varying(50) NOT NULL,
    "isGenRapportDefaut" boolean NOT NULL,
    "isGenSyntheseDefaut" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "dateDebut" timestamp without time zone,
    "dateExpiration" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)RelDocument_CatPrestation" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RelInterlocuteurBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RelInterlocuteurBien" (
    "idRelInterlocuteurBien" integer NOT NULL,
    "idSite" integer,
    "idBien" integer,
    "idInterlocuteur" integer,
    "idRoleInterlocuteurBien" character varying(50),
    "dateFin" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)RelInterlocuteurBien" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RelInterlocuteurContact; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RelInterlocuteurContact" (
    "idRelInterlocuteurContact" integer NOT NULL,
    "idInterlocuteur" integer NOT NULL,
    "idContact" integer NOT NULL,
    "idService" integer,
    "typeContact" character varying(10),
    "InsertTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "dateFin" timestamp without time zone,
    "isDefaut" boolean NOT NULL,
    fonction character varying(100),
    "idSdl" integer,
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_RG)RelInterlocuteurContact" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RelServiceInterlocuteurCadre; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RelServiceInterlocuteurCadre" (
    "idServiceInterlocuteur" integer NOT NULL,
    "idCadrePrestation" character varying(10) NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)RelServiceInterlocuteurCadre" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RestrictionGroupeUtilisateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RestrictionGroupeUtilisateur" (
    "idGroupeUtilisateur" character varying(10) NOT NULL,
    "idDroit" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isActif" boolean
);


ALTER TABLE public."(ADN_RG)RestrictionGroupeUtilisateur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RestrictionsUtilisateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RestrictionsUtilisateur" (
    "idUtilisateur" integer NOT NULL,
    "idDroit" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "isActif" boolean
);


ALTER TABLE public."(ADN_RG)RestrictionsUtilisateur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)RoleInterlocuteurBien; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)RoleInterlocuteurBien" (
    "idRoleInterlocuteurBien" character varying(50) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)RoleInterlocuteurBien" OWNER TO webadmin2;

--
-- Name: (ADN_RG)SecteurActivite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)SecteurActivite" (
    "idSecteurActivite" character varying(10) NOT NULL,
    "idDomaine" character varying(10),
    intitule character varying(255),
    "isVerrou" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)SecteurActivite" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Service; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Service" (
    "idService" integer NOT NULL,
    "discService" character varying(5),
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Service" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ServiceInterlocuteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ServiceInterlocuteur" (
    "idServiceInterlocuteur" integer NOT NULL,
    "idInterlocuteur" integer NOT NULL,
    nom character varying(255),
    telephone character varying(50),
    fax character varying(50),
    email character varying(255),
    "isDefaut" boolean,
    idfamillearticle integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "heurePMDebut" timestamp without time zone,
    "heurePMFin" timestamp without time zone,
    "heureAMDebut" timestamp without time zone,
    "heureAMFin" timestamp without time zone,
    "idSdl" integer,
    "codeService" character varying(255)
);


ALTER TABLE public."(ADN_RG)ServiceInterlocuteur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Signature; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Signature" (
    "idSignature" integer NOT NULL,
    "nomSignataire" character varying(255) NOT NULL,
    certificat character varying(255),
    type integer,
    motif text,
    "isDefaut" boolean,
    "idEmploye" integer,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)Signature" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Site; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Site" (
    "idSite" integer NOT NULL,
    code character varying(100),
    "typeProprieteSite" character varying(10),
    usage character varying(10),
    "numVoie" character varying(50),
    "cptNumVoie" character varying(10),
    "typeVoie" character varying(10),
    "nomVoie" character varying(100),
    "cptAdresse" character varying(100),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "quotePartTotale" integer,
    digicode character varying(50),
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "IdUserCre" integer,
    "idUserMaj" integer,
    "idUserSup" integer,
    "idSdl" integer,
    "ChangeTime" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "codeInsee" integer,
    latitude numeric(18,15),
    longitude numeric(18,15),
    "infoBAN" text,
    "numCopro" character varying(100),
    "idExterne" character varying(50),
    atlitude integer,
    historique text,
    "idResPhotoPlanAcces" uuid,
    "previewPhotoPlanAcces" bytea,
    "idResPhotoPlanAerien" uuid,
    "previewPhotoPlanAerien" bytea
);


ALTER TABLE public."(ADN_RG)Site" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Societe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Societe" (
    "idSociete" character varying(50) NOT NULL,
    intitule character varying(100),
    nom character varying(255),
    "idSiege" character varying(50),
    statut character varying(50),
    activite character varying(255),
    adresse1 character varying(255),
    adresse2 character varying(255),
    "codePostal" character varying(50),
    ville character varying(50),
    departement character varying(50),
    pays character varying(50),
    "telephoneFixe" character varying(50),
    fax character varying(50),
    email character varying(255),
    "siteWeb" character varying(255),
    "nomContact" character varying(255),
    "prenomContact" character varying(255),
    fonction character varying(255),
    "telephoneContact" character varying(50),
    "faxContact" character varying(50),
    "emailContact" character varying(255),
    "notesContact" character varying(255),
    "numeroIdentification" character varying(255),
    "numeroSiret" character varying(255),
    "numeroTva" character varying(255),
    "codeAPE" character varying(255),
    "capitalSocial" character varying(255),
    "policeAssurance" character varying(255),
    "isGenInfosSiege" boolean,
    "idResLogo" uuid,
    "previewDataLogo" bytea,
    "dateFin" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "outputPath" character varying(255),
    "templatePath" character varying(255),
    "defaultTemplateSet" character varying(255),
    "isGroupByIntitule" boolean,
    "oldOutputPath" character varying(255),
    "isLimiterListeEmploye" boolean NOT NULL,
    "isLimiterListeInterlocuteur" boolean NOT NULL,
    "isLimiterListeArticle" boolean NOT NULL,
    "idResTampon" uuid,
    "previewDataTampon" bytea,
    "numeroRCS" character varying(255),
    "adresse1EP" character varying(255),
    "adresse2EP" character varying(255),
    "codePostalEP" character varying(50),
    "villeEP" character varying(50),
    "departementEP" character varying(50),
    "paysEP" character varying(50),
    "telephoneFixeEP" character varying(50),
    "faxEP" character varying(50),
    "emailEP" character varying(255),
    "siteWebEP" character varying(255),
    "isAdresseEPSpecific" boolean NOT NULL,
    "codeInterne" character varying(100),
    "idResQRcode" uuid,
    "previewDataQRcode" bytea,
    "resTypeQRcode" character varying(50)
);


ALTER TABLE public."(ADN_RG)Societe" OWNER TO webadmin2;

--
-- Name: (ADN_RG)SuiviInterlocuteur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)SuiviInterlocuteur" (
    "idSuivi" integer NOT NULL,
    "typeSuivi" integer NOT NULL,
    info text,
    "idInterlocuteur" integer NOT NULL,
    "idEmploye" integer NOT NULL,
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)SuiviInterlocuteur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)TypeDocument; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)TypeDocument" (
    "idTypeDocument" integer NOT NULL,
    "DiscDocument" character varying(50),
    intitule character varying(255),
    "isVerrou" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)TypeDocument" OWNER TO webadmin2;

--
-- Name: (ADN_RG)TypePrestation; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)TypePrestation" (
    "idCategoriePrestation" character varying(50) NOT NULL,
    "idTypePrestation" character varying(10) NOT NULL,
    intitule character varying(255),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "dateFin" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)TypePrestation" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Utilisateur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Utilisateur" (
    "idUtilisateur" integer NOT NULL,
    "idGroupeUtilisateur" character varying(10),
    "idSocieteDefaut" character varying(50),
    "idEmploye" integer,
    "typeUtilisateur" character varying(1),
    login character varying(50),
    mdp character varying(50),
    "dateCre" timestamp without time zone,
    "dateMaj" timestamp without time zone,
    "dateSup" timestamp without time zone,
    "layoutAccueil" character varying(4000),
    "layoutDossier" character varying(4000),
    "layoutCroquisBuilder" character varying(4000),
    "lastNotification" timestamp without time zone,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "idSiege" character varying(50) NOT NULL,
    "layoutAccueilNomade" character varying(4000),
    "idExterne" character varying(50)
);


ALTER TABLE public."(ADN_RG)Utilisateur" OWNER TO webadmin2;

--
-- Name: (ADN_RG)ValidateurSaisie; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)ValidateurSaisie" (
    "idValidateurSaisie" integer NOT NULL,
    "productCode" character varying(50),
    "idCategorieMission" character varying(50),
    "idTypeMission" character varying(50),
    "idCadreMission" character varying(50),
    intitule character varying(255),
    description text,
    "isActif" boolean NOT NULL,
    "isObligatoire" boolean NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)ValidateurSaisie" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Verrou; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Verrou" (
    "objectType" character varying(255) NOT NULL,
    "objectId" integer NOT NULL,
    "idUtilisateur" integer,
    "dateVerrou" timestamp without time zone NOT NULL
);


ALTER TABLE public."(ADN_RG)Verrou" OWNER TO webadmin2;

--
-- Name: (ADN_RG)Version; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)Version" (
    "idVersion" integer NOT NULL,
    "DBMajorVersion" integer NOT NULL,
    "DBStructureVersion" integer NOT NULL,
    "DBDataVersion" integer NOT NULL,
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone,
    "buildVersionMin" character varying(50)
);


ALTER TABLE public."(ADN_RG)Version" OWNER TO webadmin2;

--
-- Name: (ADN_RG)VersionSqlNomade; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)VersionSqlNomade" (
    "idVersionSqlNomade" integer NOT NULL,
    "idVersion" integer,
    ordre integer,
    script text,
    "dbName" character varying(50),
    "UpdateTime" timestamp without time zone,
    "InsertTime" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)VersionSqlNomade" OWNER TO webadmin2;

--
-- Name: (ADN_RG)WebDataSync; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(ADN_RG)WebDataSync" (
    wd_id integer NOT NULL,
    wd_type character varying(10),
    "idLocal" character varying(50),
    "idDistant" character varying(50),
    "idCompteWeb" integer,
    "dateLastSync" timestamp without time zone
);


ALTER TABLE public."(ADN_RG)WebDataSync" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticle; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticle" (
    idarticle integer NOT NULL,
    datecre timestamp without time zone,
    idusercre integer,
    datemaj timestamp without time zone,
    idusermaj integer,
    datesup timestamp without time zone,
    idusersup integer,
    pack boolean NOT NULL,
    revente boolean NOT NULL,
    idfamillearticle integer,
    reference character varying(50),
    intitule character varying(4000),
    pvht numeric(18,2),
    idcategorieprestation character varying(50),
    idtypeprestation character varying(50),
    idcadreprestation character varying(50),
    commissionne boolean,
    indiceprix double precision,
    saisieprixpack boolean,
    idtypetauxtaxe integer,
    ncomptecomptavente character varying(50),
    ncomptecomptaachat character varying(50),
    pvttc numeric(18,2),
    "isInactif" boolean NOT NULL,
    "idSociete" character varying(50) NOT NULL
);


ALTER TABLE public."(GCO) GcoArticle" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleDansPack; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleDansPack" (
    idpack integer NOT NULL,
    idarticle integer NOT NULL,
    qte numeric(18,2),
    pvunitarticlepackttc numeric(18,2),
    repartition numeric(18,2),
    pvunitarticlepackht numeric(18,2)
);


ALTER TABLE public."(GCO) GcoArticleDansPack" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleDocument; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleDocument" (
    iddocument integer NOT NULL,
    doc character varying(255),
    idarticle integer
);


ALTER TABLE public."(GCO) GcoArticleDocument" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleFamille; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleFamille" (
    idfamillearticle integer NOT NULL,
    datecre timestamp without time zone,
    idusercre integer,
    datemaj timestamp without time zone,
    idusermaj integer,
    datesup timestamp without time zone,
    idusersup integer,
    typefamille character varying(50),
    codefamille character varying(50),
    intitule character varying(4000),
    coefficient double precision,
    idtypetauxtaxe integer,
    ncomptecomptavente character varying(50),
    ncomptecomptaachat character varying(50),
    "idSociete" character varying(50) NOT NULL,
    ordre integer
);


ALTER TABLE public."(GCO) GcoArticleFamille" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleListeFournisseur; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleListeFournisseur" (
    idarticle integer NOT NULL,
    idfnrs integer NOT NULL,
    pa numeric(18,2),
    pvht numeric(18,2),
    pvttc numeric(18,2)
);


ALTER TABLE public."(GCO) GcoArticleListeFournisseur" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleListePrix; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleListePrix" (
    idarticle integer NOT NULL,
    idcattarif integer NOT NULL,
    pvht numeric(18,2),
    pvttc numeric(18,2),
    "codeArticle" character varying(50),
    "designationArticle" character varying(4000)
);


ALTER TABLE public."(GCO) GcoArticleListePrix" OWNER TO webadmin2;

--
-- Name: (GCO) GcoArticleRemiseClient; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoArticleRemiseClient" (
    idremiseclient integer NOT NULL,
    idarticle integer,
    idfamillearticle integer,
    idcatclient integer NOT NULL,
    idtypeprix integer,
    coefficient numeric(18,2),
    idtyperemise integer,
    remise numeric(18,2)
);


ALTER TABLE public."(GCO) GcoArticleRemiseClient" OWNER TO webadmin2;

--
-- Name: (GCO) GcoAssocTiersFamilleTarif; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoAssocTiersFamilleTarif" (
    idtiers integer NOT NULL,
    "idFamilleCatTarif" integer NOT NULL
);


ALTER TABLE public."(GCO) GcoAssocTiersFamilleTarif" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCommunReglement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCommunReglement" (
    idreglement integer NOT NULL,
    datecre timestamp without time zone,
    idusercre integer,
    datemaj timestamp without time zone,
    idusermaj integer,
    datesup timestamp without time zone,
    idusersup integer,
    datereglement timestamp without time zone,
    idtiers integer,
    refreglement character varying(50),
    idmoyenpaiement integer,
    numero character varying(50),
    banque character varying(100),
    idreglementspecial integer,
    montant numeric(18,2),
    accompte boolean,
    libelle character varying(100),
    verrouille boolean,
    transferecompta boolean,
    nreglement integer,
    idsitedegestion character varying(50),
    idribsitedegestion integer,
    "migratedData" boolean,
    commentaire character varying(255),
    isvalide boolean,
    "dateValidation" timestamp without time zone,
    "iduserValidation" integer,
    "numeroBordereau" character varying(255)
);


ALTER TABLE public."(GCO) GcoCommunReglement" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCommunRibSiteDeGestion; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCommunRibSiteDeGestion" (
    idrib integer NOT NULL,
    idsitedegestion character varying(50) NOT NULL,
    codebanque character varying(50),
    intitule character varying(100),
    codeguichet character varying(50),
    compte character varying(50),
    cle character varying(50),
    commentaire text,
    bprincipale boolean,
    adresse character varying(255),
    complementadresse character varying(255),
    cp character varying(50),
    ville character varying(100),
    ncomptecompta character varying(50),
    "idSociete" character varying(50) NOT NULL
);


ALTER TABLE public."(GCO) GcoCommunRibSiteDeGestion" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCommunTaxe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCommunTaxe" (
    idtaxe integer NOT NULL,
    idlocalisation integer,
    idtypetaux integer,
    "Libelle" character varying(100),
    "Taux" numeric(18,2),
    ncomptecompta character varying(50),
    "dateFin" timestamp without time zone
);


ALTER TABLE public."(GCO) GcoCommunTaxe" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCompteTiers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCompteTiers" (
    idtiers integer NOT NULL,
    idfamilletiers integer,
    idcatclient integer,
    idcommercial integer,
    ncomptecompta character varying(50),
    classement character varying(100),
    idpayeur integer,
    idribsitedegestion integer,
    tauxremise numeric(18,2),
    tauxescompte numeric(18,2),
    certification character varying(100),
    numerocertification character varying(100),
    siret character varying(50),
    nintra character varying(50),
    ape character varying(50),
    registrecomm character varying(255),
    idrisquetiers integer,
    incidentpaiement integer,
    dateincident timestamp without time zone,
    idregularitepaiement integer,
    idcotationsolvabilite integer,
    "DiffDatePieceEtEcheance" integer,
    "DiffDateEchanceEtRelance" integer,
    "isChorusPro" boolean,
    "idFamilleCatTarif" integer
);


ALTER TABLE public."(GCO) GcoCompteTiers" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCompteTiersFamille; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCompteTiersFamille" (
    idfamilletiers integer NOT NULL,
    datecre timestamp without time zone,
    idusercre integer,
    datemaj timestamp without time zone,
    idusermaj integer,
    datesup timestamp without time zone,
    idusersup integer,
    codefamille character varying(100),
    ncomptecompta character varying(50),
    classement character varying(100),
    idcommercial integer,
    idcatclient integer,
    tauxremise numeric(18,2),
    tauxescompte numeric(18,2),
    "idSociete" character varying(50) NOT NULL
);


ALTER TABLE public."(GCO) GcoCompteTiersFamille" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCompteTiersLivraison; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCompteTiersLivraison" (
    idlivraison integer NOT NULL,
    idtiers integer NOT NULL,
    intitule character varying(100),
    ad1 character varying(255),
    ad2 character varying(255),
    ad3 character varying(255),
    cp character varying(50),
    ville character varying(100),
    tel character varying(50),
    fax character varying(50),
    email character varying(255),
    expedition character varying(100),
    condition character varying(100),
    lprincipal boolean,
    idsite integer
);


ALTER TABLE public."(GCO) GcoCompteTiersLivraison" OWNER TO webadmin2;

--
-- Name: (GCO) GcoCompteTiersRib; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoCompteTiersRib" (
    idrib integer NOT NULL,
    idtiers integer NOT NULL,
    codebanque character varying(50),
    intitule character varying(100),
    codeguichet character varying(50),
    compte character varying(50),
    cle character varying(50),
    commentaire text,
    bprincipale boolean,
    adresse character varying(255),
    complementadresse character varying(255),
    cp character varying(50),
    ville character varying(100)
);


ALTER TABLE public."(GCO) GcoCompteTiersRib" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumAssociationCatTarif; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumAssociationCatTarif" (
    idcattarif integer NOT NULL,
    idobjetprestation integer NOT NULL
);


ALTER TABLE public."(GCO) GcoEnumAssociationCatTarif" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumBanque; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumBanque" (
    idbanque integer NOT NULL,
    nombanque character varying(100)
);


ALTER TABLE public."(GCO) GcoEnumBanque" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumCategorieClient; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumCategorieClient" (
    idcatclient integer NOT NULL,
    catclient character varying(50)
);


ALTER TABLE public."(GCO) GcoEnumCategorieClient" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumCategorieTarif; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumCategorieTarif" (
    idcattarif integer NOT NULL,
    cattarif character varying(255),
    idproduitmetier character varying(10),
    "idFamilleCatTarif" integer,
    "nbLocauxMin" integer,
    "nbLocauxMax" integer,
    "isFiltreLocaux" boolean,
    "sMin" double precision,
    "sMax" double precision,
    "isFiltreSurface" boolean,
    "isBati" boolean,
    "isNonBati" boolean,
    "isPrive" boolean,
    "isCollectif" boolean,
    "isLot" boolean,
    "isErp" boolean,
    "isIop" boolean,
    "isIGH" boolean,
    "isHabitation" boolean,
    "isAgricole" boolean,
    "isIndustriel" boolean,
    "isTertiaire" boolean,
    "isRoute" boolean,
    "isMixte" boolean,
    "isPcommune" boolean,
    "isErp1" boolean,
    "isErp2" boolean,
    "isErp3" boolean,
    "isErp4" boolean,
    "isErp5" boolean,
    "isPlv" boolean,
    "plvMin" integer,
    "plvMax" integer,
    "isNiv" boolean,
    "nivMin" integer,
    "nivMax" integer
);


ALTER TABLE public."(GCO) GcoEnumCategorieTarif" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumCotationSolvabilite; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumCotationSolvabilite" (
    idcotation integer NOT NULL,
    intitule character varying(100)
);


ALTER TABLE public."(GCO) GcoEnumCotationSolvabilite" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFamilleCategorieTarifaire; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFamilleCategorieTarifaire" (
    "idFamilleCatTarif" integer NOT NULL,
    "libFamille" character varying(255)
);


ALTER TABLE public."(GCO) GcoEnumFamilleCategorieTarifaire" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeDomainePiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeDomainePiece" (
    iddomainepiece integer NOT NULL,
    domainepiece character varying(50)
);


ALTER TABLE public."(GCO) GcoEnumFixeDomainePiece" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeLogicielCompta; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeLogicielCompta" (
    idlogiciel integer NOT NULL,
    nomlogiciel character varying(100)
);


ALTER TABLE public."(GCO) GcoEnumFixeLogicielCompta" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeParamLogiciel; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeParamLogiciel" (
    "idParametre" integer NOT NULL,
    zone character varying(50),
    intitule character varying(255),
    valeur character varying(100),
    "idSociete" character varying(50) NOT NULL
);


ALTER TABLE public."(GCO) GcoEnumFixeParamLogiciel" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeRisqueTiers; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeRisqueTiers" (
    idrisque integer NOT NULL,
    intitule character varying(50),
    action character varying(50),
    encoursmin double precision,
    encoursmax double precision
);


ALTER TABLE public."(GCO) GcoEnumFixeRisqueTiers" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeTypePiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeTypePiece" (
    idtypepiece integer NOT NULL,
    iddomainepiece integer NOT NULL,
    typepiece character varying(50),
    prefixdoc character varying(50),
    compteur integer,
    "tmpCompteur" integer
);


ALTER TABLE public."(GCO) GcoEnumFixeTypePiece" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeTypePrix; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeTypePrix" (
    idtypeprix integer NOT NULL,
    typeprix character varying(50)
);


ALTER TABLE public."(GCO) GcoEnumFixeTypePrix" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeTypeRemise; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeTypeRemise" (
    idtyperemise integer NOT NULL,
    typeremise character varying(50)
);


ALTER TABLE public."(GCO) GcoEnumFixeTypeRemise" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumFixeTypeTauxTaxe; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumFixeTypeTauxTaxe" (
    idtypetaux integer NOT NULL,
    libelletypetaux character varying(50)
);


ALTER TABLE public."(GCO) GcoEnumFixeTypeTauxTaxe" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumModaliteReglement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumModaliteReglement" (
    idmodalitereglement integer NOT NULL,
    modalitereglement character varying(100)
);


ALTER TABLE public."(GCO) GcoEnumModaliteReglement" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumMoyenPaiement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumMoyenPaiement" (
    idmoyenpaiement integer NOT NULL,
    moyenpaiement character varying(50) NOT NULL,
    remisecheque boolean,
    exportjournalcaisse boolean,
    codeexport character varying(5)
);


ALTER TABLE public."(GCO) GcoEnumMoyenPaiement" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumPlanComptable; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumPlanComptable" (
    idplancomptable integer NOT NULL,
    intitule character varying(50),
    ncomptecompta character varying(50),
    lettrageactuel character varying(5)
);


ALTER TABLE public."(GCO) GcoEnumPlanComptable" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumRegularitePaiement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumRegularitePaiement" (
    idregul integer NOT NULL,
    intitule character varying(100)
);


ALTER TABLE public."(GCO) GcoEnumRegularitePaiement" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumSuiviPiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumSuiviPiece" (
    idsuivipiece integer NOT NULL,
    idtypepiece integer,
    libelleetape character varying(50),
    ordre integer,
    idresponsable integer
);


ALTER TABLE public."(GCO) GcoEnumSuiviPiece" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumTransformationPiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumTransformationPiece" (
    idtransformation integer NOT NULL,
    idtypepieceorigine integer,
    idtypepiecedestination integer
);


ALTER TABLE public."(GCO) GcoEnumTransformationPiece" OWNER TO webadmin2;

--
-- Name: (GCO) GcoEnumTypeReglementsSpeciaux; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoEnumTypeReglementsSpeciaux" (
    idreglementspecial integer NOT NULL,
    reglementspecial character varying(50),
    montantnegatif boolean,
    ncomptecompta character varying(50),
    comptebanque boolean,
    codeexport character varying(5)
);


ALTER TABLE public."(GCO) GcoEnumTypeReglementsSpeciaux" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPiece; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPiece" (
    idpiece integer NOT NULL,
    datecre timestamp without time zone,
    idusercre integer,
    datemaj timestamp without time zone,
    idusermaj integer,
    datesup timestamp without time zone,
    idusersup integer,
    idproduitmetier character varying(10) NOT NULL,
    iddomainepiece integer NOT NULL,
    idtypepiece integer NOT NULL,
    factureavoir boolean,
    datepiece timestamp without time zone,
    dateecheance timestamp without time zone,
    daterelance timestamp without time zone,
    increment integer,
    refpiece character varying(50),
    nfacture integer,
    idtiers integer,
    codetiers character varying(50),
    typepersonnetiers character varying(1),
    titretiers character varying(50),
    nomtiers character varying(100),
    ad1tiers character varying(255),
    ad2tiers character varying(255),
    villetiers character varying(100),
    cptiers character varying(50),
    destinatairetiers character varying(255),
    adressagetiers boolean,
    idpayeur integer,
    codepayeur character varying(50),
    nompayeur character varying(100),
    ad1payeur character varying(255),
    ad2payeur character varying(255),
    cppayeur character varying(50),
    villepayeur character varying(100),
    destinatairepayeur character varying(255),
    adressagepayeur boolean,
    reliquat boolean,
    idcatclient integer,
    idsuivipiece integer,
    idtyperemise integer,
    remiseht numeric(18,2),
    tauxescompte numeric(18,2),
    totalhtbrut numeric(18,2),
    totalremiseht numeric(18,2),
    totalescompte numeric(18,2),
    totalhtnet numeric(18,2),
    totaltaxe numeric(18,2),
    totalttcnet numeric(18,2),
    resteapayer numeric(18,2),
    valide boolean,
    idpieceorigine integer,
    idpieceparent integer,
    transformee boolean,
    idmodalitereglement integer,
    relance integer,
    facturesoldee boolean,
    verrouille boolean,
    transferecompta boolean,
    lettrage character varying(5),
    idsitedegestion character varying(50),
    idcommercial integer,
    chequeaecheance boolean,
    "migratedData" boolean,
    commentaire text,
    ttc boolean,
    totalttcbrut numeric(18,2),
    totalremisettc numeric(18,2),
    remisettc numeric(18,2),
    titre character varying(100),
    idpays integer,
    idserviceinterlocuteur integer,
    idmoyenpaiementprevisionel integer,
    "idContrat" integer,
    "referenceExterne" character varying(255),
    "idSociete" character varying(50),
    "numeroSociete" integer,
    "dateLivraison" timestamp without time zone,
    "codeServiceTiers" character varying(255),
    "codeServicePayeur" character varying(255),
    "numBonCommande" character varying(255),
    "numEngagement" character varying(255),
    "dateLivraisonFin" timestamp without time zone,
    "idParentAnnule" integer,
    "idEnfantAnnule" integer,
    "idAvoir" integer,
    "dateValidation" timestamp without time zone,
    "iduserValidation" integer,
    "isCtrlAF" boolean,
    "idFamilleCat" integer,
    "dateSuivi" timestamp without time zone
);


ALTER TABLE public."(GCO) GcoPiece" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPieceHistoSuivi; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPieceHistoSuivi" (
    idhisto integer NOT NULL,
    idpiece integer,
    idsuivipiece integer,
    datechangement timestamp without time zone,
    idresponsable integer,
    idcommercial integer,
    idutilisateur integer
);


ALTER TABLE public."(GCO) GcoPieceHistoSuivi" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPieceMetier; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPieceMetier" (
    idpiece integer NOT NULL,
    idmetier integer NOT NULL
);


ALTER TABLE public."(GCO) GcoPieceMetier" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPieceReglement; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPieceReglement" (
    idreglement integer NOT NULL,
    idpiece integer NOT NULL,
    repartitionmontant numeric(18,2),
    lettrage character varying(5)
);


ALTER TABLE public."(GCO) GcoPieceReglement" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPieceRelance; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPieceRelance" (
    idrelance integer NOT NULL,
    idpiece integer NOT NULL,
    daterelance timestamp without time zone,
    niveau integer,
    validation boolean
);


ALTER TABLE public."(GCO) GcoPieceRelance" OWNER TO webadmin2;

--
-- Name: (GCO) GcoPieceVente; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) GcoPieceVente" (
    iddetailpiece integer NOT NULL,
    idpiece integer NOT NULL,
    idarticle integer,
    idparent integer,
    repartitionparent numeric(18,2),
    reference character varying(50),
    designation character varying(4000),
    puht numeric(18,4),
    qte numeric(18,2),
    idtyperemise integer,
    remiseht numeric(18,2),
    montantremiseht numeric(18,4),
    puhtnet numeric(18,4),
    montantht numeric(18,4),
    totalhtnetpiece numeric(18,4),
    idtaxe integer,
    tauxtaxe numeric(18,2),
    totaltaxepiece numeric(18,4),
    totalttcnetpiece numeric(18,4),
    ordre integer,
    commissionne boolean,
    idmetier integer,
    idcattarif integer,
    puttc numeric(18,4),
    remisettc numeric(18,2),
    montantremisettc numeric(18,4),
    puttcnet numeric(18,4),
    montantttc numeric(18,4),
    "codeBPU" character varying(50),
    "designationBPU" character varying(4000)
);


ALTER TABLE public."(GCO) GcoPieceVente" OWNER TO webadmin2;

--
-- Name: (GCO) ParamLog; Type: TABLE; Schema: public; Owner: webadmin2
--

CREATE UNLOGGED TABLE public."(GCO) ParamLog" (
    "tableName" character varying(100) NOT NULL,
    date timestamp without time zone
);


ALTER TABLE public."(GCO) ParamLog" OWNER TO webadmin2;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: webadmin2
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 04xd9ZDCGVPQ15FC2k1VgkGfnmfyvKNDdHl5ZUXSboX9tHffH4meUhJZJApeEgJ

