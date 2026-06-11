//Informacion del index
const campoBPM = document.getElementById("BPM");
const campoEstilo = document.getElementById("estilo");
const campoNota = document.getElementById("nota");
const campoTipoEscala = document.getElementById("tipoEscala");
const campoTipoPercusion = document.getElementById("percusion");
const amongus = document.getElementById("amongus");
var estilo;
var contextoAudio, oscilador, gainNode; //variables de sonido necesarias de js
var bpm, bpm_seg, bpm_decseg, bpm_miliseg; //Medidas de tiempo
var volumen = 1;

var notasBase = [];
var escalaFormada = [];
var armonia = [[], [], []];
var melodia = [];
var percusion = []; //0=silencio 1=bombo 2=caja

var escalaMayor = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24]; //TTSTTTS
var escalaMenor = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 16, 18, 19, 21, 23]; //TSTTSTT

//devuelve un numero aleatorio entre 0 y num
function NumeroAleatorio(num) {
  return Math.floor(Math.random() * num);
}

//Funcion que devuelve true o false a partir de una probabilidad
function BooleanoAleatorio(probabilidad) {
  return Math.random() < probabilidad;
}

//Indica si el numero ingresado es par
function esPar(num) {
  return num % 2 == 0;
}

//Creando las 12 notas que se usaran como base
var notaDoBase = 130.8128;
for (let i = 0; notasBase.length < 13; i++) {
  if (i != 0) {
    notaDoBase *= 2 ** (1 / 12);
  }
  notasBase[i] = notaDoBase;
}

function crearEscala(escala, frecuenciaBase) {
  //creamos una escala con las elecciones del usuario
  let base = [];
  escalaFormada = [];

  //Creamos dos octavas con notas base
  for (let i = 0; base.length < 25; i++) {
    if (i != 0) {
      frecuenciaBase *= 2 ** (1 / 12);
    }
    base[i] = frecuenciaBase;
  }

  //Descartamos notas segun el tipo de escala
  if (escala) {
    //Si la escala es mayor
    for (let i = 0; i < escalaMayor.length; i++) {
      escalaFormada.push(base[escalaMayor[i]]);
    }
  } //Si la escala es menor
  else {
    for (let i = 0; i < escalaMayor.length; i++) {
      escalaFormada.push(base[escalaMenor[i]]);
    }
  }
}

function CrearCancionAleatoria(escala) {
  //Creamos la cancion a partir de una escala
  let bateriaActivada = false;
  let compasLocal = 0;
  let notaAleatoria = NumeroAleatorio(8);
  let fundamental;
  let tercera;
  let quinta;
  let golpeBateria = 0;
  for (let i = 0; i < 160; i++) {
    if (compasLocal == 4) {
      if (BooleanoAleatorio(0.5)) {
        //Probabilidad del 50% de que un compas se repita
        let listaTemporalAR = [];
        let listaTemporalME = [];
        for (let x = 4; x > 0; x--) {
          listaTemporalAR.push(armonia[i - x]);
          listaTemporalAR.push(melodia[i - x]);
        }
        armonia = armonia.concat(listaTemporalAR);
        melodia = melodia.concat(listaTemporalME);
      }
      if (BooleanoAleatorio(0.2)) {
        bateriaActivada = true;
      } //20% de chance que comience la bateria

      compasLocal = 0;
      //Elegimos una nota aleatoria de la escala
      notaAleatoria = NumeroAleatorio(8);
    }
    if (bateriaActivada) {
      if (esPar(compasLocal)) {
        golpeBateria = 1;
      } //se agrega un golpe de caja
      else {
        golpeBateria = 2;
      } //se agrega un golpe de bombo
    }

    fundamental = escala[notaAleatoria];
    tercera = escala[notaAleatoria + 2];
    quinta = escala[notaAleatoria + 4];

    armonia[0][i] = fundamental;
    armonia[1][i] = tercera;
    armonia[2][i] = quinta;

    melodia[i] = armonia[NumeroAleatorio(3)][i];

    percusion[i] = golpeBateria;

    if (BooleanoAleatorio(0.5)) {
      melodia[i] *= 2;
    }

    compasLocal++;
  }
  armonia[0] = armonia[0].concat(armonia[0]);
  armonia[1] = armonia[1].concat(armonia[1]);
  armonia[2] = armonia[2].concat(armonia[2]);
  melodia = melodia.concat(melodia);
  percusion = percusion.concat(percusion);
}

//Funcion necesaria para el funcionamiento del sonido
function ConfigurarOscilador(nota) {
  contextoAudio = new (window.AudioContext || window.webkitAudioContext)(); //Contexto del audio
  oscilador = contextoAudio.createOscillator(); //Oscilador del audio
  gainNode = contextoAudio.createGain(); // Nodo de ganancia (volumen)

  oscilador.type = estilo; //Tipo de onda a utilizar
  oscilador.frequency.value = nota; //Frecuencia de la nota

  oscilador.connect(gainNode); //conectar al nodo de ganancia
  gainNode.connect(contextoAudio.destination); //conectar a los parlantes
  gainNode.gain.value = 0.05; //Volumen al 5%
}
function AplicarConfiguracion() {
  //Aplicamos las elecciones del usuario
  bpm = campoBPM.value;
  bpm_seg = 60 / bpm;
  bpm_decseg = bpm_seg * 10;
  bpm_miliseg = bpm_seg * 1000;

  estilo = campoEstilo.value;
  let index = campoNota.value;
  let notaElegida = notasBase[index];
  crearEscala(campoTipoEscala, notaElegida);
  ConfigurarOscilador(notaElegida);
}

function ReproducirMelodia(nota) {
  let oscilador = contextoAudio.createOscillator();
  let envelope = contextoAudio.createGain();
  oscilador.type = "sine";
  oscilador.frequency.value = nota * 4;
  oscilador.connect(envelope);
  envelope.connect(gainNode);

  envelope.gain.setValueAtTime(volumen, contextoAudio.currentTime); // Volumen inicial

  oscilador.start();

  // Detener el oscilador y desconectar nodos después de un segundo
  setTimeout(() => {
    envelope.gain.linearRampToValueAtTime(0.1, contextoAudio.currentTime + 0.1); // Disminuir el volumen antes de detener el sonido
    oscilador.stop(contextoAudio.currentTime + 0.1);
    oscilador.disconnect(envelope);
    envelope.disconnect(gainNode);
  }, bpm_miliseg);
}

//ARREGLAR VOLUMEN
function ReproducirNota(nota) {
  let oscilador = contextoAudio.createOscillator();
  let envelope = contextoAudio.createGain(); // Nodo de ganancia para controlar el volumen
  let volumenLocal = volumen;

  if (estilo == "square" || estilo == "sawtooth") {
    volumenLocal /= 2;
  }

  oscilador.type = estilo;
  oscilador.frequency.value = nota;
  oscilador.connect(envelope); // Conectar el oscilador al nodo de ganancia
  envelope.connect(gainNode);

  // Configurar el volumen inicial y el tiempo de ataque
  envelope.gain.setValueAtTime(volumenLocal, contextoAudio.currentTime); // Volumen inicial
  envelope.gain.linearRampToValueAtTime(
    0.0001,
    contextoAudio.currentTime + bpm_decseg / 8
  ); // Volumen final después de 0.1 segundos

  oscilador.start();

  // Detener el oscilador y desconectar nodos después de un segundo
  setTimeout(() => {
    envelope.gain.linearRampToValueAtTime(0.1, contextoAudio.currentTime + 0.1); // Disminuir el volumen antes de detener el sonido
    oscilador.stop(contextoAudio.currentTime + 0.1);
    oscilador.disconnect(envelope);
    envelope.disconnect(gainNode);
  }, bpm_miliseg);
}

//Intento de percusion
function ReproducirPercusion(golpe, duracion) {
  let tipoPercusion = campoTipoPercusion.value;
  let estilo = "sine";
  let volumenLocal = 0.1;
  let frecuencia;
  duracion /= 10;

  if (tipoPercusion != 3) {
    //Configuramos segun las elecciones del usuario

    if (golpe == 0) {
      //Si la bateria esta silenciada
      frecuencia = 0;
    } else if (golpe == 1) {
      //bombo
      frecuencia = 80;
      estilo = "sine";
      duracion = duracion / 10;
      volumenLocal = 1.2;
    } //caja
    else {
      frecuencia = 240;
      if (tipoPercusion == 0) {
        estilo = "square";
        volumenLocal = 0.08;
      } else if (tipoPercusion == 1) {
        estilo = "sine";
      } else if (tipoPercusion == 2) {
        estilo = "sawtooth";
      }
    }
    let oscilador = contextoAudio.createOscillator();
    let envelope = contextoAudio.createGain();

    oscilador.type = estilo; // Puedes experimentar con diferentes formas de onda (e.g., 'sine', 'square', 'sawtooth', 'triangle')
    oscilador.frequency.value = frecuencia; // Frecuencia del sonido de percusión
    oscilador.connect(envelope);
    envelope.connect(contextoAudio.destination);

    envelope.gain.setValueAtTime(volumenLocal, contextoAudio.currentTime);
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      contextoAudio.currentTime + duracion
    ); // Decaimiento exponencial del sonido

    oscilador.start(contextoAudio.currentTime);
    oscilador.stop(contextoAudio.currentTime + duracion);
  }
}

function ReproducirCancion() {
  //Reproducimos la cancion formada
  AplicarConfiguracion(); //Aplicar la configuracion del usuario
  CrearCancionAleatoria(escalaFormada); //Creamos la cancion a partir de su escala
  let i = 0;
  let compasLocal = 0;
  let audioSonando = false;
  if (!audioSonando) {
    amongus.classList.add("amongsus");
    function Reproducir() {
      if (i < armonia.length) {
        compasLocal++;

        ReproducirNota(armonia[0][i]);
        ReproducirNota(armonia[1][i]);
        ReproducirNota(armonia[2][i]);

        ReproducirNota(melodia[i]);

        ReproducirPercusion(percusion[i], bpm_decseg);

        i++;
        if (compasLocal == 4) {
          compasLocal = 0;
        }

        setTimeout(Reproducir, bpm_miliseg);
      } else {
        audioSonando = false;
        i = 0;
      }
    }

    audioSonando = true;
    Reproducir();
  }
}
