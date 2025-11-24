"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Plane, Car, Flame, Home, Map, ChevronRight, ChevronLeft, Download, MountainSnow, Droplets, Recycle, Trees, Bike, BadgeCheck, Zap, Truck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { trackEvent } from "@/lib/analytics"; // ajusta la ruta según tu estructura


// ===== UTIL =====
const fmt = (n: number) => Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(n);

const PASOS = [
  { key: "id", label: "Identificación", icon: <Map className="w-4 h-4" /> },
  { key: "transporte", label: "Transporte", icon: <Car className="w-4 h-4" /> },
  { key: "alojamiento", label: "Alojamiento", icon: <Home className="w-4 h-4" /> },
  { key: "alimentacion", label: "Alimentación", icon: <Flame className="w-4 h-4" /> },
  { key: "actividades", label: "Actividades", icon: <MountainSnow className="w-4 h-4" /> },
  { key: "residuosagua", label: "Residuos y agua", icon: <Droplets className="w-4 h-4" /> },
  { key: "resultado", label: "Resultado", icon: <Leaf className="w-4 h-4" /> },
];


const CITY_PRESET_KM_ONEWAY: Record<string, number> = {
  "Chillán": 0,
  "Concepción": 0,
  "Santiago": 0,
  "Antofagasta": 0,
  "Valparaíso": 0,
  "Viña del Mar": 0,
  "La Serena": 0,
  "Temuco": 0,
  "Rancagua": 0,
  "Iquique": 0,
  "Puerto Montt": 0,
  "Otra": 0,
};

// Destinos disponibles en tu selector
const DESTINOS = [
  "Pinto- Valle Las Trancas",
  "Pinto- Nevados de Chillán",
  "San Fabián - Pichirincón - Los Sauces",
  "Pinto - Shangri-LA - Waldorf - Garganta del Diablo",
  "Yungay - Ranchillo Alto - El Avellano",
  "El Carmen - Atacalco - Los Riscos",
  "Pemuco - Monteleón",
  "Coihueco - Las Lumas - Reserva Huemules",
  "Antuco- Laguna del Laja- Sierra Velluda",
];

// Distancias de IDA (km) por combinación Origen → Destino principal
// Aproximadas. Ajusta a tu metodología/localidad cuando quieras.
const DIST_IDA_KM: Record<string, Record<string, number>> = {
  "Chillán": {
    "Pinto- Valle Las Trancas": 70,
    "Pinto- Nevados de Chillán": 75,
    "San Fabián - Pichirincón - Los Sauces": 86,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 38,
    "Yungay - Ranchillo Alto - El Avellano": 65,
    "El Carmen - Atacalco - Los Riscos": 52,
    "Pemuco - Monteleón": 60,
    "Coihueco - Las Lumas - Reserva Huemules": 33,
    "Antuco- Laguna del Laja- Sierra Velluda": 140,
  },
  "Concepción": {
    "Pinto- Valle Las Trancas": 210,
    "Pinto- Nevados de Chillán": 220,
    "San Fabián - Pichirincón - Los Sauces": 230,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 165,
    "Yungay - Ranchillo Alto - El Avellano": 150,
    "El Carmen - Atacalco - Los Riscos": 135,
    "Pemuco - Monteleón": 140,
    "Coihueco - Las Lumas - Reserva Huemules": 190,
    "Antuco- Laguna del Laja- Sierra Velluda": 190,
  },
  "Santiago": {
    "Pinto- Valle Las Trancas": 470,
    "Pinto- Nevados de Chillán": 480,
    "San Fabián - Pichirincón - Los Sauces": 505,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 445,
    "Yungay - Ranchillo Alto - El Avellano": 430,
    "El Carmen - Atacalco - Los Riscos": 420,
    "Pemuco - Monteleón": 425,
    "Coihueco - Las Lumas - Reserva Huemules": 470,
    "Antuco- Laguna del Laja- Sierra Velluda": 520,
  },
  "Antofagasta": {
    "Pinto- Valle Las Trancas": 1640,
    "Pinto- Nevados de Chillán": 1650,
    "San Fabián - Pichirincón - Los Sauces": 1670,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 1630,
    "Yungay - Ranchillo Alto - El Avellano": 1620,
    "El Carmen - Atacalco - Los Riscos": 1610,
    "Pemuco - Monteleón": 1620,
    "Coihueco - Las Lumas - Reserva Huemules": 1650,
    "Antuco- Laguna del Laja- Sierra Velluda": 1700,
  },
  "Valparaíso": {
    "Pinto- Valle Las Trancas": 520,
    "Pinto- Nevados de Chillán": 530,
    "San Fabián - Pichirincón - Los Sauces": 555,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 500,
    "Yungay - Ranchillo Alto - El Avellano": 485,
    "El Carmen - Atacalco - Los Riscos": 475,
    "Pemuco - Monteleón": 480,
    "Coihueco - Las Lumas - Reserva Huemules": 525,
    "Antuco- Laguna del Laja- Sierra Velluda": 560,
  },
  "Viña del Mar": {
    "Pinto- Valle Las Trancas": 515,
    "Pinto- Nevados de Chillán": 515,
    "San Fabián - Pichirincón - Los Sauces": 545,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 495,
    "Yungay - Ranchillo Alto - El Avellano": 480,
    "El Carmen - Atacalco - Los Riscos": 470,
    "Pemuco - Monteleón": 475,
    "Coihueco - Las Lumas - Reserva Huemules": 520,
    "Antuco- Laguna del Laja- Sierra Velluda": 555,
  },
  "La Serena": {
    "Pinto- Valle Las Trancas": 710,
    "Pinto- Nevados de Chillán": 720,
    "San Fabián - Pichirincón - Los Sauces": 745,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 690,
    "Yungay - Ranchillo Alto - El Avellano": 680,
    "El Carmen - Atacalco - Los Riscos": 670,
    "Pemuco - Monteleón": 675,
    "Coihueco - Las Lumas - Reserva Huemules": 720,
    "Antuco- Laguna del Laja- Sierra Velluda": 760,
  },
  "Temuco": {
    "Pinto- Valle Las Trancas": 370,
    "Pinto- Nevados de Chillán": 380,
    "San Fabián - Pichirincón - Los Sauces": 405,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 350,
    "Yungay - Ranchillo Alto - El Avellano": 335,
    "El Carmen - Atacalco - Los Riscos": 325,
    "Pemuco - Monteleón": 330,
    "Coihueco - Las Lumas - Reserva Huemules": 375,
    "Antuco- Laguna del Laja- Sierra Velluda": 260,
  },
  "Rancagua": {
    "Pinto- Valle Las Trancas": 420,
    "Pinto- Nevados de Chillán": 430,
    "San Fabián - Pichirincón - Los Sauces": 455,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 400,
    "Yungay - Ranchillo Alto - El Avellano": 390,
    "El Carmen - Atacalco - Los Riscos": 380,
    "Pemuco - Monteleón": 385,
    "Coihueco - Las Lumas - Reserva Huemules": 430,
    "Antuco- Laguna del Laja- Sierra Velluda": 470,
  },
  "Iquique": {
    "Pinto- Valle Las Trancas": 1990,
    "Pinto- Nevados de Chillán": 2000,
    "San Fabián - Pichirincón - Los Sauces": 2020,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 1980,
    "Yungay - Ranchillo Alto - El Avellano": 1970,
    "El Carmen - Atacalco - Los Riscos": 1960,
    "Pemuco - Monteleón": 1970,
    "Coihueco - Las Lumas - Reserva Huemules": 2000,
    "Antuco- Laguna del Laja- Sierra Velluda": 2050,
  },
  "Puerto Montt": {
    "Pinto- Valle Las Trancas": 630,
    "Pinto- Nevados de Chillán": 640,
    "San Fabián - Pichirincón - Los Sauces": 665,
    "Pinto - Shangri-LA - Waldorf - Garganta del Diablo": 610,
    "Yungay - Ranchillo Alto - El Avellano": 600,
    "El Carmen - Atacalco - Los Riscos": 590,
    "Pemuco - Monteleón": 595,
    "Coihueco - Las Lumas - Reserva Huemules": 640,
    "Antuco- Laguna del Laja- Sierra Velluda": 520,
  },
};


// Factores (ejemplos)
const F_TRANSP = { auto_gasolina:0.18, auto_diesel:0.20, auto_hibrido:0.11, kwh_100km:17, grid:0.35, bus:0.06, avion:0.15, van_local:0.10, moto_nieve_h:18.0, snowcat_h:4.0, motocicleta_verano:0.12, cuadrimoto_verano:0.24 }
const F_ALOJA = { hotel:9.0, hostal:6.0, cabana:5.5, camping:2.0, cal:{lena:3.0, gas:2.0, diesel:3.5, elec:1.5, ninguna:0.5} };
const F_ALIM = { locales:2.5, cadenas:3.2, auto:1.6, bonus_local:-0.6 };
const F_ACT = { ski:2.5, trekking:0.3, cabalgata:1.0, mtb:0.6, raquetas:0.4, canopy:0.8, moto:8.0, otro:0.8 };
const F_RES = { manejo:{sep:0.2, comunes:0.6, regreso:0.1, otro:0.5}, agua:{prom:0.5, bajo:0.2, alto:0.9} };

const ESTADO_INICIAL = {
  id: { origen:"Chillán", destino:"Pinto- Nevados de Chillán", km_personalizado:0 },
  transporte: { medio:"Auto gasolina", pasajeros_auto:2, consumo_e_kwh_100:17, uso_local:[] as string[], km_local_total:20 },
  alojamiento: { tipo:"Cabaña", noches:2, calefaccion:"Leña", personas_total:2 },
  alimentacion: { donde:"Restaurantes locales", productos_locales:true, dias:2 },
  actividades: { seleccion:[] as string[], horas: {} as Record<string, number> },
  residuosagua: { manejo:"Separé y reciclé", agua:"Promedio (no sé)", dias:2 },
};



// Reusable card
function Card({children}:{children:React.ReactNode}){
  return <div className="shadow-lg rounded-2xl border border-slate-200">{children}</div>;
}
function CardHeader({title,icon,subtitle}:{title:string,icon:React.ReactNode,subtitle?:string}){
  return <div className="p-5 border-b">
    <div className="flex items-center gap-2 text-slate-800 text-lg font-semibold">
      <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>
      <span>{title}</span>
    </div>
    {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
  </div>;
}
function CardContent({children}:{children:React.ReactNode}){
  return <div className="p-5 grid gap-4">{children}</div>
}

export default function HuellaConPortada(){
  const [start,setStart] = useState(false);
  return (
    <div className="relative min-h-screen text-white">
      <AnimatePresence initial={false} mode="wait">
        {!start ? (
          <motion.section
            key="cover"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative min-h-[100svh] flex items-center justify-center"
          >
            <img src="/laguna.jpeg" alt="Parque Nacional Laguna del Laja" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 text-center max-w-3xl px-6">
              <img src="/logo.png" alt="Logo" className="mx-auto mb-20 h-48 w-auto" />
              <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
                Mide tu huella. <span className="text-emerald-300">Actúa</span>. Disfruta la ruta.
              </motion.h1>
              <p className="mt-5 text-lg text-white/90">Calcula tu huella de carbono para tu visita a la Reserva de Biósfera "Corredor Biológico Nevados de Chillán – Laguna del Laja"  y recibe acciones de compensación para compensar tu huella.</p>
              <motion.button onClick={()=>{
    // 🔹 Evento GA: el usuario inicia la calculadora solo agrega un "}" al final de setStart
    trackEvent("calculator_start", {
      category: "Calculadora",
      origen_inicial: "Chillán",             // opcional, solo info extra
      destino_inicial: "Pinto- Nevados de Chillán",
    });
setStart(true)}} whileTap={{ scale: 0.97 }} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-8 py-4 font-semibold text-gray-900 shadow-lg hover:bg-white">
                🚀 Comenzar ahora
              </motion.button>
            </div>
          </motion.section>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Calculadora />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Calculadora(){
  const [paso,setPaso] = useState(0);
  const [st,setSt] = useState(ESTADO_INICIAL);

    const [tabResultados, setTabResultados] = useState<"desglose" | "acciones">("desglose");

  // Banner por cada paso del formulario
  const bannerMap: Record<number, string> = {
    0: "/foto-identificacion.jpg",
    1: "/foto-transporte.png",
    2: "/foto-alojamiento.jpg",
    3: "/foto-alimentacion.jpg",
    4: "/foto-actividades.jpg",
    5: "/foto-residuos.jpg",
    6: "/foto-resultados.jpg",
  };
  const bannerSrc = bannerMap[paso] ?? "/laguna.jpeg";


  const set = (path:string, value:any) => {
    setSt(s => {
      const c:any = structuredClone(s);
      const keys = path.split(".");
      let cur:any = c;
      for (let i=0;i<keys.length-1;i++) cur = cur[keys[i]];
      cur[keys.at(-1)!] = value;
      return c;
    });
  };

  const progreso = Math.round(((paso+1)/PASOS.length)*100);

  const { desglose, totalKg, totalTons, topCat, baseKm } = useMemo(()=>{
    const baseKm = st.id.km_personalizado>0 ? st.id.km_personalizado : DIST_IDA_KM[st.id.origen]?.[st.id.destino]  ?? (CITY_PRESET_KM_ONEWAY[st.id.origen] ?? 0);
    const kmTotal = baseKm*2;

    let llegarKg = 0;
    switch(st.transporte.medio){
      case "Auto gasolina": llegarKg = (kmTotal*F_TRANSP.auto_gasolina)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto diésel": llegarKg = (kmTotal*F_TRANSP.auto_diesel)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto híbrido": llegarKg = (kmTotal*F_TRANSP.auto_hibrido)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto eléctrico": {
        const kwh = (kmTotal * st.transporte.consumo_e_kwh_100)/100;
        llegarKg = (kwh*F_TRANSP.grid)/Math.max(1, st.transporte.pasajeros_auto); break;
      }
      case "Bus interurbano": llegarKg = kmTotal*F_TRANSP.bus; break;
      case "Avión + transporte terrestre": {
        const km_avion = kmTotal*0.8, km_bus=kmTotal*0.2;
        llegarKg = km_avion*F_TRANSP.avion + km_bus*F_TRANSP.bus; break;
      }
      default: llegarKg = kmTotal*0.15;
    }

    let localKg = 0;
    const km_local = st.transporte.km_local_total;
    if (st.transporte.uso_local.includes("Traslado en van/bus")) localKg += km_local*F_TRANSP.van_local;
    if (st.transporte.uso_local.includes("Moto de nieve")) localKg += 2*F_TRANSP.moto_nieve_h;
    if (st.transporte.uso_local.includes("Snowcat/andarivel")) localKg += 2*F_TRANSP.snowcat_h;
    if (st.transporte.uso_local.includes("Motocicleta (verano)")) localKg += km_local * F_TRANSP.motocicleta_verano;
    if (st.transporte.uso_local.includes("Cuadrimoto (verano)")) localKg += km_local * F_TRANSP.cuadrimoto_verano;


    const noches = st.alojamiento.noches;
    const share = Math.max(1, st.alojamiento.personas_total);
    let alojBase = F_ALOJA.cabana;
    if (st.alojamiento.tipo==="Hotel") alojBase = F_ALOJA.hotel;
    if (st.alojamiento.tipo==="Hostal") alojBase = F_ALOJA.hostal;
    if (st.alojamiento.tipo==="Camping") alojBase = F_ALOJA.camping;

    let cal = F_ALOJA.cal.ninguna;
    if (st.alojamiento.calefaccion==="Leña") cal=F_ALOJA.cal.lena;
    if (st.alojamiento.calefaccion==="Gas") cal=F_ALOJA.cal.gas;
    if (st.alojamiento.calefaccion==="Diésel") cal=F_ALOJA.cal.diesel;
    if (st.alojamiento.calefaccion==="Electricidad") cal=F_ALOJA.cal.elec;
    const alojamientoKg = ((alojBase+cal)*noches)/share;

    const dias = st.alimentacion.dias;
    let alim = F_ALIM.locales;
    if (st.alimentacion.donde==="Cadenas externas") alim=F_ALIM.cadenas;
    if (st.alimentacion.donde==="Autoabastecido") alim=F_ALIM.auto;
    alim *= dias;
    if (st.alimentacion.productos_locales) alim += F_ALIM.bonus_local*dias;
    if (alim<0) alim=0;

    const H = st.actividades.horas as Record<string,number>;
    const act = (H["Ski/Snowboard"]||0)*F_ACT.ski + (H["Trekking"]||0)*F_ACT.trekking + (H["Cabalgata"]||0)*F_ACT.cabalgata + (H["MTB"]||0)*F_ACT.mtb + (H["Raquetas"]||0)*F_ACT.raquetas + (H["Canopy"]||0)*F_ACT.canopy + (H["Moto de nieve"]||0)*F_ACT.moto + (H["Otro"]||0)*F_ACT.otro;

    let res = F_RES.manejo.sep;
    if (st.residuosagua.manejo==="Basureros comunes") res=F_RES.manejo.comunes;
    if (st.residuosagua.manejo==="Me los llevé de regreso") res=F_RES.manejo.regreso;
    if (st.residuosagua.manejo==="Otro") res=F_RES.manejo.otro;

    let agua = F_RES.agua.prom;
    if (st.residuosagua.agua==="Bajo") agua = F_RES.agua.bajo;
    if (st.residuosagua.agua==="Alto") agua = F_RES.agua.alto;
    const resAgua = (res+agua)*st.residuosagua.dias;

    const desglose = [
      { name:"Transporte ida/regreso", kg:llegarKg },
      { name:"Transporte local", kg:localKg },
      { name:"Alojamiento", kg:alojamientoKg },
      { name:"Alimentación", kg:alim },
      { name:"Actividades", kg:act },
      { name:"Residuos/Agua", kg:resAgua },
    ];
    const totalKg = desglose.reduce((s,x)=>s+x.kg,0);
    const top = desglose.reduce((a,b)=>a.kg>b.kg?a:b, desglose[0]);
    return { desglose, totalKg, totalTons: totalKg/1000, topCat: top.name, baseKm };
  },[st]);

   // === Equivalencias simples a partir del total ===
  const kmAutoEquivalentes = totalKg / 0.18;
  const arbolesEquivalentes = totalKg / 100; 

   // % que representa la categoría de mayor contribución
  const topEntry = desglose.find((d) => d.name === topCat);
  const topPct = topEntry && totalKg > 0 ? (topEntry.kg / totalKg) * 100 : 0;
  
  const colores = ["#10b981","#0ea5e9","#f59e0b","#ef4444","#6366f1","#14b8a6"];

  const exportar = () => {
    const payload = { inputs: st, resultados: { desglose, totalKg, totalTons, topCat } };
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="resultado-huella-nevados.json"; a.click(); URL.revokeObjectURL(url);
  };

  const acciones: Record<string, Array<{icon: JSX.Element, titulo:string, texto:string}>> = {
    "Transporte ida/regreso": [
      { icon:<Car className="w-4 h-4"/>, titulo:"Comparte el auto", texto:"Llena los asientos: baja el CO2 por persona."},
      { icon:<Plane className="w-4 h-4"/>, titulo:"Combina bus + avión", texto:"Reduce el tramo aéreo cuando sea posible."},
      { icon:<Bike className="w-4 h-4"/>, titulo:"Elige rutas cercanas", texto:"Prefiere destinos del corredor más próximos."},
    ],
    "Transporte local": [
      { icon:<Truck className="w-4 h-4"/>, titulo:"Van compartida", texto:"Evita múltiples autos dentro del valle."},
      { icon:<MountainSnow className="w-4 h-4"/>, titulo:"Limita moto de nieve", texto:"Solo si es necesario; prioriza andariveles."},
      { icon:<Bike className="w-4 h-4"/>, titulo:"Bici o a pie", texto:"Para trayectos cortos, sin motor."},
    ],
    "Alojamiento": [
      { icon:<Home className="w-4 h-4"/>, titulo:"Alojamiento eficiente", texto:"Prefiere cabañas/hostales con eficiencia energética."},
      { icon:<Zap className="w-4 h-4"/>, titulo:"Calefacción limpia", texto:"Leña seca certificada o electricidad eficiente."},
    ],
    "Alimentación": [
      { icon:<BadgeCheck className="w-4 h-4"/>, titulo:"Compra local", texto:"Más impacto en la comunidad, menos transporte."},
      { icon:<Recycle className="w-4 h-4"/>, titulo:"Menos envases", texto:"Usa contenedores reutilizables."},
    ],
    "Actividades": [
      { icon:<Trees className="w-4 h-4"/>, titulo:"Más trekking/MTB", texto:"Prioriza actividades de bajo impacto."},
      { icon:<MountainSnow className="w-4 h-4"/>, titulo:"Optimiza ski/snow", texto:"Concentra horas y evita traslados extra."},
    ],
    "Residuos/Agua": [
      { icon:<Recycle className="w-4 h-4"/>, titulo:"Basura cero", texto:"Separa y retorna residuos si no hay gestión."},
      { icon:<Droplets className="w-4 h-4"/>, titulo:"Ahorro de agua", texto:"Duchas cortas y uso racional."},
    ]
  };
 const renderLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RAD = Math.PI / 180;
    const r = outerRadius + 18;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);

    if (percent < 0.03) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#334155"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

      // Utilidad: convierte /public/archivo.png en dataURL para jsPDF
async function fileToDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// =====================================================
// PALETA DE COLORES (RGB explícito SIN SPREADS)
// =====================================================
const COLOR = {
  emeraldDark: { r: 16, g: 120, b: 96 },
  emerald: { r: 16, g: 185, b: 129 },
  emeraldLight: { r: 209, g: 250, b: 229 },

  slateDark: { r: 51, g: 65, b: 85 },
  slate: { r: 71, g: 85, b: 105 },
  slateLight: { r: 100, g: 116, b: 139 },

  white: { r: 255, g: 255, b: 255 }
};


// =====================================================
// EXPORTAR PDF PREMIUM (FINAL, SIN ERRORES)
// =====================================================
const exportarPDF = async () => {
  // 🔹 Evento GA: exportación de PDF
  trackEvent("pdf_export", {
    category: "Export",
    origen: st.id.origen,
    destino: st.id.destino,
    totalKg,
    mayor_categoria: topCat,
  });
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const docAny = doc as any; // para lastAutoTable, textWithLink, etc. sin pelear con TS
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // === HEADER SUPERIOR ===
  doc.setFillColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);
  doc.rect(0, 0, W, 90, "F");

  try {
    const logo = await fileToDataURL("/logo.png");
    if (logo) doc.addImage(logo, "PNG", 30, 18, 80, 55);
  } catch {}

  doc.setTextColor(COLOR.white.r, COLOR.white.g, COLOR.white.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Reporte de Huella de Carbono", 130, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Corredor Biológico Nevados de Chillán – Laguna del Laja", 130, 60);


  // === CAJA RESUMEN ===

  const cardX = 30;
  const cardY = 110;
  const cardW = W - 60;
  const cardH = 110;
  const cardCenterX = cardX + cardW / 2;

  doc.setFillColor(COLOR.white.r, COLOR.white.g, COLOR.white.b);
  doc.setDrawColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);
  doc.roundedRect(30, 110, W - 60, 110, 12, 12, "FD");

  doc.setTextColor(COLOR.slate.r, COLOR.slate.g, COLOR.slate.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Huella estimada de tu visita", 50, 140);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);
  doc.text(`${totalKg.toFixed(2)} kg CO2`, cardCenterX, 180, {
    align: "center"
  } as any);


  // === UBICACIÓN ===
  const baseKmMostrar = Math.round(baseKm);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(COLOR.slateLight.r, COLOR.slateLight.g, COLOR.slateLight.b);
  doc.text(
    `Origen: ${st.id.origen}   ·   Destino: ${st.id.destino}   ·   Distancia ida: ${baseKmMostrar} km`,
    50,
    212
  );


  // === TABLA DESGLOSE ===
  const rows = desglose.map((d) => {
    const pct = totalKg > 0 ? ((d.kg / totalKg) * 100).toFixed(1) + "%" : "0%";
    return [d.name, `${d.kg.toFixed(2)} kg`, pct];
  });

  autoTable(doc, {
    head: [["Categoría", "Emisiones", "Participación"]], 
    body: rows,
    startY: 240,
    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: [COLOR.slate.r, COLOR.slate.g, COLOR.slate.b]
    },
    headStyles: {
      fillColor: [COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b],
      textColor: [COLOR.white.r, COLOR.white.g, COLOR.white.b],
      fontStyle: "bold"
    },
    bodyStyles: {
      fillColor: [248, 250, 252]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: 30, right: 30 },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { halign: "right" },
      2: { halign: "right" }
    }
  });


  // =====================================================
  // ACCIONES RECOMENDADAS (VERSIÓN MEJORADA)
  // =====================================================
  let yAcc = 0;

  if (docAny.lastAutoTable && docAny.lastAutoTable.finalY) {
    yAcc = docAny.lastAutoTable.finalY + 30;
  } else {
    yAcc = 240 + 30;
  }

  // Título de la sección
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR.slateDark.r, COLOR.slateDark.g, COLOR.slateDark.b);
  doc.text(`Acciones recomendadas (mayor contribución: ${topCat})`, 30, yAcc);

  yAcc += 18;

  const lista = acciones[topCat] || [];

  if (!lista.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(COLOR.slate.r, COLOR.slate.g, COLOR.slate.b);
    doc.text(
      "Revisa en la calculadora consejos personalizados para reducir tu huella en esta categoría.",
      30,
      yAcc
    );
  } else {
    const cardMarginX = 30;
    const cardWidth = W - 60;

    lista.forEach((a, idx) => {
      // Si se acerca al final de la página, saltar a nueva
      const espacioMinimo = 120; // espacio mínimo para una tarjeta
      if (yAcc + espacioMinimo > H - 60) {
        doc.addPage();
        yAcc = 60;
      }

      // Texto principal de la acción
      const titulo = a.titulo || `Acción ${idx + 1}`;
      const texto = a.texto || "";
      const impacto = (a as any).impacto as string | undefined; // opcional: "Reduce hasta un 20% tu huella"
      const link = (a as any).link as string | undefined;       // opcional: URL con más info

      // Calcula alto de la tarjeta según contenido
      const contenidoYBase = yAcc + 32; // donde empieza el texto descriptivo
      const wrapped = doc.splitTextToSize(
        texto,
        cardWidth - 60 // margen interior de la tarjeta
      );
      let cardHeight = 50 + wrapped.length * 12; // base estimada

      if (impacto) cardHeight += 14;
      if (link) cardHeight += 16;

      // Fondo de tarjeta
      doc.setFillColor(COLOR.emeraldLight.r, COLOR.emeraldLight.g, COLOR.emeraldLight.b);
      doc.roundedRect(cardMarginX, yAcc, cardWidth, cardHeight, 10, 10, "F");

      // Número dentro de círculo (marcador dinámico)
      const iconCenterX = cardMarginX + 20;
      const iconCenterY = yAcc + 20;
      doc.setFillColor(COLOR.emerald.r, COLOR.emerald.g, COLOR.emerald.b);
      doc.circle(iconCenterX, iconCenterY, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLOR.white.r, COLOR.white.g, COLOR.white.b);
      // número centrado aprox.
      doc.text(String(idx + 1), iconCenterX - 3, iconCenterY + 3);

      // Título de la acción
      doc.setTextColor(COLOR.slateDark.r, COLOR.slateDark.g, COLOR.slateDark.b);
      doc.setFontSize(12);
      doc.text(titulo, cardMarginX + 40, yAcc + 18);

      let textoY = contenidoYBase;

      // Impacto (si existe)
      if (impacto) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);
        doc.text(`Impacto estimado: ${impacto}`, cardMarginX + 40, yAcc + 34);
        textoY = yAcc + 50;
      }

      // Descripción
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(COLOR.slate.r, COLOR.slate.g, COLOR.slate.b);
      doc.text(wrapped, cardMarginX + 40, textoY);

      let afterTextoY = textoY + wrapped.length * 12;

      // Link “interactivo” (clicable en el PDF) si existe
      if (link) {
        const linkLabel = "Ver guía o recurso en línea";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);

        // texto subrayado como link
        const linkX = cardMarginX + 40;
        const linkY = afterTextoY + 10;
        doc.text(linkLabel, linkX, linkY);
        const linkWidth = doc.getTextWidth(linkLabel);
        doc.setDrawColor(COLOR.emeraldDark.r, COLOR.emeraldDark.g, COLOR.emeraldDark.b);
        doc.setLineWidth(0.5);
        doc.line(linkX, linkY + 1, linkX + linkWidth, linkY + 1);

        // hace el texto clicable
        try {
          docAny.textWithLink(linkLabel, linkX, linkY, { url: link });
        } catch {
          // si textWithLink no existe, el PDF al menos muestra la URL como texto
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(COLOR.slateLight.r, COLOR.slateLight.g, COLOR.slateLight.b);
          doc.text(link, linkX, linkY + 12);
        }

        afterTextoY = linkY + 16;
      }

      // Avanzar para la siguiente tarjeta
      yAcc = Math.max(yAcc + cardHeight + 12, afterTextoY + 12);
    });
  }


  // === FOOTER ===
  doc.setFontSize(9);
  doc.setTextColor(COLOR.slateLight.r, COLOR.slateLight.g, COLOR.slateLight.b);
  doc.text(`Generado el ${new Date().toLocaleString()}`, 30, H - 30);

  doc.save("reporte-huella-premium.pdf");
};

// Colores fijos por categoría (elige los que prefieras)
const COLOR_BY_CAT: Record<string, string> = {
  "Transporte ida/regreso": "#10b981",   // verde
  "Transporte local": "#0ea5e9", // celeste
  "Alojamiento": "#f59e0b",     // amarillo/naranja
  "Alimentación": "#ef4444",    // rojo
  "Actividades": "#6366f1",     // violeta
  "Residuos/Agua": "#14b8a6",   // teal
};

// Reconstruye la data del donut con el color correcto por nombre
const donutData = React.useMemo(
  () =>
    (desglose ?? []).map((d) => ({
      ...d,
      color: COLOR_BY_CAT[d.name] ?? "#94a3b8", // gris si no está mapeado
    })),
  [desglose]
);

// Etiqueta externa: muestra "Nombre XX%" fuera de cada porción (oculta < 2%)
function OutsideLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  if (!percent || percent * 100 < 2) return null; // oculta porciones muy pequeñas
  const RAD = Math.PI / 180;
  const r = outerRadius + 14;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);

  return (
    <text
      x={x}
      y={y}
      fill="#0f172a"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontFamily="Inter, ui-sans-serif, system-ui"
      fontSize={20}
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

// Texto centrado dentro del donut (usa Label content de Recharts)
function CenterLabel({ viewBox }: any) {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontFamily="Inter, ui-sans-serif, system-ui"
        fontWeight={700}
        fill="#0f172a"
      >
        {Number(totalKg || 0).toFixed(2)} kg
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontFamily="Inter, ui-sans-serif, system-ui"
        fontWeight={500}
        fill="#64748b"
      >
        CO₂e
      </text>
    </g>
  );
}

// Tooltip: muestra "x.xx kg (yy%)"
const tooltipFormatter = (value: number, _name: string, params: any) => {
  const v = Number(value || 0);
  const pct = totalKg ? (v / totalKg) * 100 : 0;
  return [`${v.toFixed(2)} kg (${pct.toFixed(0)}%)`, ""]; // [valor, etiqueta]
};

// ---- Etiqueta exterior más pegada al donut
const outerLabel = (props: any) => {
  const RAD = Math.PI / 180;
  const {
    cx, cy, midAngle, outerRadius, percent, name,
  } = props;
if (!percent || percent * 100 < 2) return null; // oculta <2%

  // Distancia desde el borde del donut a la etiqueta
  // (baja este número para pegarla más)
  const GAP = 25;                         // antes 12–14

  const r = outerRadius + GAP;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const anchor = x >= cx ? 'start' : 'end';

  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      className="fill-slate-700"
      style={{ fontSize: 13 }}
    >
      {name} {Math.round((percent ?? 0) * 100)}%
    </text>
  );
};

// Texto central del donut
function CenterText({ viewBox, totalKg }: any) {
  if (!viewBox || !viewBox.cx || !viewBox.cy) return null;

  const { cx, cy } = viewBox;

  return (
    <g>
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={28}
        fontWeight="bold"
        fill="#0f172a"
      >
        {totalKg.toFixed(2)} kg
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fill="#475569"
      >
        CO₂e
      </text>
    </g>
  );
}

// 👇 Paso 2 integración analítica de google
  const handleSiguientePaso = () => {
    setPaso((prevPaso) => {
      const nextPaso = Math.min(PASOS.length - 1, prevPaso + 1);

      // 👇 Aquí detectamos el salto de PASO 5 → PASO 6 (Resultado)
      if (prevPaso === 5 && nextPaso === 6) {
        // Evento: el usuario terminó el flujo (equivalente a "submit")
        trackEvent("calculator_submit", {
          category: "Calculadora",
          origen: st.id.origen,
          destino: st.id.destino,
          km_ida: Math.round(baseKm),
          noches: st.alojamiento.noches,
          dias_estadia: st.residuosagua.dias,
        });

        // Evento: cálculo exitoso con el resultado numérico
        trackEvent("calculator_success", {
          category: "Calculadora",
          totalKg,
          totalTons,
          mayor_categoria: topCat,
        });
      }

      return nextPaso;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-800">
      <header className="max-w-6xl mx-auto px-4 py-6">

  {/* FILA 1: Texto + Logo arriba ocupando TODO el ancho */}
  <div className="flex items-start gap-3 mb-4">
    <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
    <div>
      <h1 className="text-3xl font-semibold leading-tight">
        Calcula tu huella de carbono - 
        Reserva de Biósfera "Corredor Biológico Nevados de Chillán - Laguna del Laja"
      </h1>
      <p className="text-sm text-slate-500 mt-3">
        Calcula tu impacto y recibe acciones locales para reducir y compensar.
      </p>
    </div>
  </div>

  {/* FILA 2: Indicadores ABAJO, horizontal */}
    <div className="hidden md:flex flex-wrap gap-3 text-sm md:justify-start">

    {PASOS.map((s, i) => (
      <div
        key={s.key}
        className={`px-4 py-2 rounded-full border ${
          i === paso
            ? "bg-emerald-600 text-white border-emerald-600"
            : "bg-white text-slate-600 border-slate-200"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {s.icon}
          {s.label}
        </span>
      </div>
    ))}
  </div>
 
</header>

      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden mb-6">
          <img src={bannerSrc} alt="Imagen de la sección" className="w-full h-52 object-cover" />
        </div>

        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-emerald-600" style={{width:`${Math.max(5, progreso)}%`}} />
        </div>

        {paso===0 && (
        
          <Card>
            <CardHeader title="Identificación" icon={<Map/>} subtitle="Origen, destino y distancia (ida; calculamos ida y vuelta)." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Ciudad/punto de origen</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.origen} onChange={e=>set("id.origen", e.target.value)}>
                    {Object.keys(DIST_IDA_KM).concat("Otra").map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Destino principal</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.destino} onChange={e=>set("id.destino", e.target.value)}>
                    {DESTINOS.concat("Otro").map(x => (<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Distancia estimada ida (km) — personaliza si tu ciudad es lejana</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.km_personalizado} onChange={e=>set("id.km_personalizado", Number(e.target.value||0))} />
                  <p className="text-xs text-slate-500 mt-1">Si dejas en cero, usamos el valor referencial según tu ciudad. El cálculo considera ida + vuelta.</p>
                  <p className="text-xs text-slate-500 mt-1"> Usando {Math.round(baseKm)} km de ida según la combinación {st.id.origen} → {st.id.destino}.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===1 && (
          <Card>
            <CardHeader title="Transporte" icon={<Car/>} subtitle="Modo para llegar y movilidad local." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Medio utilizado para llegar</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.medio} onChange={e=>set("transporte.medio", e.target.value)}>
                    {["Auto gasolina","Auto diésel","Auto híbrido","Auto eléctrico","Bus interurbano","Avión + transporte terrestre","Otro"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                {st.transporte.medio.startsWith("Auto") && (
                  <div>
                    <label className="text-sm">Pasajeros (incluyéndote)</label>
                    <input type="number" min={1} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.pasajeros_auto} onChange={e=>{const v = Math.min(8, Math.max(1, Number(e.target.value||1))); set("transporte.pasajeros_auto", v);}} />
                  </div>
                )}
                {st.transporte.medio==="Auto eléctrico" && (
                  <div className="sm:col-span-2">
                    <label className="text-sm">Consumo p/auto eléctrico (kWh/100 km)</label>
                    <input type="number" min={8} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.consumo_e_kwh_100} onChange={e=>set("transporte.consumo_e_kwh_100", Number(e.target.value||15))} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="text-sm">Transporte local utilizado</label>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    {["Traslado en van/bus","Moto de nieve","Snowcat/andarivel","Bicicleta","A pie","Motocicleta (verano)","Cuadrimoto (verano)","Otro"].map(opt=>(
                      <label key={opt} className="flex items-center gap-2">
                        <input type="checkbox" checked={st.transporte.uso_local.includes(opt)} onChange={e=>{
                          const setSel = new Set(st.transporte.uso_local);
                          e.target.checked ? setSel.add(opt) : setSel.delete(opt);
                          set("transporte.uso_local", Array.from(setSel));
                        }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Km locales (ida + vuelta)</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.km_local_total} onChange={e=>set("transporte.km_local_total", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===2 && (
          <Card>
            <CardHeader title="Alojamiento" icon={<Home/>} subtitle="Tipo, noches, calefacción y si compartes." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Tipo de alojamiento</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.tipo} onChange={e=>set("alojamiento.tipo", e.target.value)}>
                    {["Hotel","Hostal","Cabaña","Camping"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Noches</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.noches} onChange={e=>set("alojamiento.noches", Number(e.target.value||0))} />
                </div>
                <div>
                  <label className="text-sm">Calefacción</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.calefaccion} onChange={e=>set("alojamiento.calefaccion", e.target.value)}>
                    {["Leña","Gas","Diésel","Electricidad","Ninguna"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Compartido (personas totales)</label>
                  <input type="number" min={1} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.personas_total} onChange={e=>set("alojamiento.personas_total", Number(e.target.value||1))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===3 && (
          <Card>
            <CardHeader title="Alimentación" icon={<Flame/>} subtitle="Dónde consumiste y si eliges productos locales." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">¿Dónde consumiste la mayoría?</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alimentacion.donde} onChange={e=>set("alimentacion.donde", e.target.value)}>
                    {["Restaurantes locales","Cadenas externas","Autoabastecido"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" checked={st.alimentacion.productos_locales} onChange={e=>set("alimentacion.productos_locales", e.target.checked)} />
                  <span className="text-sm">¿Principalmente productos locales?</span>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Días de estadía</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alimentacion.dias} onChange={e=>set("alimentacion.dias", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===4 && (
          <Card>
            <CardHeader title="Actividades" icon={<MountainSnow/>} subtitle="Selecciona actividades y horas por actividad." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-sm">
                  {["Ski/Snowboard","Trekking","Cabalgata","MTB","Raquetas","Canopy","Moto de nieve","Otro"].map(act=>(
                    <label key={act} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.actividades.seleccion.includes(act)} onChange={e=>{
                        const setSel = new Set(st.actividades.seleccion);
                        e.target.checked ? setSel.add(act) : setSel.delete(act);
                        set("actividades.seleccion", Array.from(setSel));
                      }} />
                      {act}
                    </label>
                  ))}
                </div>
                {st.actividades.seleccion.map(act=>(
                  <div key={act}>
                    <label className="text-sm">Horas en {act}</label>
                    <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.actividades.horas[act]||0} onChange={e=>set(`actividades.horas.${act}`, Number(e.target.value||0))} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {paso===5 && (
          <Card>
            <CardHeader title="Residuos y agua" icon={<Droplets/>} subtitle="Manejo de residuos, consumo de agua y días de visita." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Manejo de residuos</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.manejo} onChange={e=>set("residuosagua.manejo", e.target.value)}>
                    {["Separé y reciclé","Basureros comunes","Me los llevé de regreso","Otro"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Consumo de agua por día</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.agua} onChange={e=>set("residuosagua.agua", e.target.value)}>
                    {["Promedio (no sé)","Bajo","Alto"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Días de visita</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.dias} onChange={e=>set("residuosagua.dias", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
   {/* 🔽 Paso 6: resultado moderno */}
        {paso === 6 && (
          <Card>
            <CardHeader
              title="Resultado y acciones"
              icon={<Leaf />}
              subtitle="Visualiza el impacto de tu visita, el desglose por categoría y las acciones con mayor efecto para reducir tu huella."
            />
            <CardContent>
              <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 items-start">
                {/* Columna izquierda: donut + tabs */}
                <div className="space-y-5 order-2 lg:order-1">
                  {/* Donut */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Distribución de tu huella
                        </p>
                        <p className="text-sm text-slate-600">
                          Cómo se reparte tu impacto entre las distintas
                          categorías.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Leaf className="w-3 h-3" />
                        Vista detallada
                      </span>
                    </div>

                    <div
                      className="mt-2"
                      style={{
                        transform: "scale(0.95)",
                        transformOrigin: "center",
                      }}
                    >
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart margin={{ top: 8, right: 120, bottom: 8, left: 8 }}>
                          <defs>
                            <filter
                              id="softShadow2"
                              x="-20%"
                              y="-20%"
                              width="140%"
                              height="140%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="3"
                                stdDeviation="3"
                                floodColor="#000000"
                                floodOpacity="0.12"
                              />
                            </filter>
                          </defs>

                          <Pie
                            data={donutData}
                            dataKey="kg"
                            nameKey="name"
                            cx="64%"
                            cy="48%"
                            innerRadius={70}
                            outerRadius={104}
                            paddingAngle={2}
                            cornerRadius={10}
                            labelLine
                            label={outerLabel}
                            stroke="#ffffff"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={600}
                            filter="url(#softShadow2)"
                          >
                            {donutData.map((entry, i) => (
                              <Cell key={entry.name + i} fill={entry.color} />
                            ))}

                            <Label
                              content={(props) => (
                                <CenterText {...props} totalKg={totalKg} />
                              )}
                              position="center"
                            />
                          </Pie>

                          <Tooltip formatter={tooltipFormatter} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabs: Desglose / Acciones clave */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                    <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs mb-4">
                      <button
                        type="button"
                        onClick={() => setTabResultados("desglose")}
                        className={`px-4 py-1.5 rounded-full transition ${
                          tabResultados === "desglose"
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        Desglose
                      </button>
                      <button
                        type="button"
                        onClick={() => setTabResultados("acciones")}
                        className={`px-4 py-1.5 rounded-full transition ${
                          tabResultados === "acciones"
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        Acciones clave
                      </button>
                    </div>

                    {tabResultados === "desglose" ? (
                      <div className="space-y-3">
                        {desglose.map((b, i) => {
                          const pct =
                            totalKg > 0 ? (b.kg / totalKg) * 100 : 0;
                          const isTop = b.name === topCat;
                          return (
                            <div
                              key={b.name}
                              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                                isTop
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : "bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-3.5 h-3.5 rounded-full"
                                  style={{
                                    background:
                                      colores[i % colores.length],
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-800">
                                    {b.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {pct.toFixed(1)}% del total
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-slate-900">
                                  {b.kg.toFixed(2)} kg
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          En tu viaje,{" "}
                          <span className="font-semibold text-slate-800">
                            {topCat}
                          </span>{" "}
                          concentra aproximadamente{" "}
                          <span className="font-semibold text-slate-800">
                            {topPct.toFixed(1)}% de tu huella total
                          </span>
                          . Priorizar mejoras en esta categoría tiene el
                          mayor impacto.
                        </p>
                        <div className="space-y-2">
                          {(acciones[topCat] || []).map((a, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5"
                            >
                              <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                                {a.icon}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-emerald-900">
                                  {a.titulo}
                                </p>
                                <p className="text-xs text-emerald-700">
                                  {a.texto}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha: KPI + equivalencias + acciones principales */}
                <div className="order-1 lg:order-2 space-y-4">
                  {/* Tarjeta principal */}
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-5 text-white shadow-md">
                    <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-emerald-400/20 blur-2xl" />
                    <div className="relative">
                      <p className="text-xs uppercase tracking-wide text-emerald-100">
                        Huella estimada de tu visita
                      </p>
                      <p className="mt-1 text-3xl font-extrabold">
                        {totalKg.toFixed(2)} kg CO₂e
                      </p>
                      <p className="mt-2 text-xs text-emerald-50 leading-relaxed">
                        Esto es similar a recorrer{" "}
                        <span className="font-semibold">
                          {kmAutoEquivalentes.toFixed(0)} km
                        </span>{" "}
                        en un auto a gasolina, o requerir aproximadamente{" "}
                        <span className="font-semibold">
                          {arbolesEquivalentes.toFixed(1)} árboles
                        </span>{" "}
                        absorbiendo CO₂ durante un año para compensarlo.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-3 py-1">
                          <Map className="w-3 h-3" />
                          Origen: {st.id.origen}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-3 py-1">
                          <MountainSnow className="w-3 h-3" />
                          Destino: {st.id.destino}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-3 py-1">
                          <Car className="w-3 h-3" />
                          Distancia ida ref: {Math.round(baseKm)} km
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones principales */}
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                    <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                      Acciones principales según mayor contribución
                    </p>
                    <p className="text-sm text-emerald-800">
                      Categoría prioritaria:{" "}
                      <span className="font-semibold">{topCat}</span> (
                      {topPct.toFixed(1)}% de tu huella).
                    </p>
                    <p className="text-xs text-emerald-800/90">
                      Si mejoras esta categoría, lograrás el mayor impacto en
                      la reducción de CO₂. Te sugerimos comenzar por estas
                      acciones:
                    </p>

                    <ul className="mt-2 space-y-2">
                      {(acciones[topCat] || []).map((a, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 border border-emerald-100"
                        >
                          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            {a.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-emerald-900">
                              {a.titulo}
                            </p>
                            <p className="text-xs text-emerald-700">
                              {a.texto}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botones */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={exportar}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Download className="w-4 h-4" />
                      Exportar JSON
                    </button>
                    <button
                      type="button"
                      onClick={exportarPDF}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      📄 Exportar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSt(ESTADO_INICIAL);
                        setPaso(0);
                        trackEvent("calculator_reset", {
                          category: "Calculadora",
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      🔄 Nuevo viaje
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegación de pasos */}
        <div className="flex items-center justify-between my-6">
          <button
            onClick={() => {
              trackEvent("step_back", {
                category: "Calculadora",
                paso_actual: paso + 1,
              });
              setPaso((p) => Math.max(0, p - 1));
            }}
            disabled={paso === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
          <div className="text-sm text-slate-500">
            Paso {paso + 1} de {PASOS.length}
          </div>
          <button
            onClick={handleSiguientePaso}
            disabled={paso === PASOS.length - 1}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <footer className="mt-12 border-t">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-slate-400">
              Corredor Biológico Nevados de Chillán – Laguna del Laja
            </p>
            <p className="text-slate-400">(Ñuble/Biobío).</p>
          </div>
          <div>
            <p className="font-medium text-slate-600">
              Universidad de Concepción
            </p>
            <p className="text-slate-500 mt-1">
              Departamento de Ingeniería Industrial
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-600">
              Calculadora de huella de carbono
            </p>
            <p className="text-slate-500 mt-1">
              Mide y contribuye con tu visita
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
