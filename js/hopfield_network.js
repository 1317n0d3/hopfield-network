let canvas = document.querySelector("#canvas"),
  context = canvas.getContext("2d"),
  network = {},
  can;

class Input {
  constructor(countImages, directory, imagesFormat, startNameNumber) {
    this.images = Array(countImages)
      .fill(0)
      .map((value) => new Image());

    this.images.forEach(
      (value, index) =>
        (value.src =
          directory + "/" + (startNameNumber + index) + "." + imagesFormat)
    );

    this.pixels = [];
    this.imagesTraining = new Image();
    this.examplesTraining = [];
    this.iDontKnowImage = new Image();
    this.iDontKnowImage.src = "images/png/dont_know.png";
  }

  allClear(context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  load() {
    this.pixels = this.images.map((value, indexValue) => {
      this.allClear(context);

      context.drawImage(value, 0, 0);

      let data = [];

      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          let rgb = context.getImageData(x, y, 1, 1).data.slice(0, 3);

          data.push(
            rgb.reduce((accumulator, value) => accumulator + value / 255, 0) >=
              1.5
              ? 1
              : -1
          );
        }
      }

      return data;
    });
  }

  loadTrain(url) {
    this.imagesTraining.src = url;

    setTimeout(() => {
      url ? this.allClear(can.context) : null;

      can.context.drawImage(this.imagesTraining, 0, 0);

      this.examplesTraining = [];

      for (let x = 0; x < can.width; x++) {
        for (let y = 0; y < can.height; y++) {
          let rgb = can.context.getImageData(x, y, 1, 1).data.slice(0, 3);

          this.examplesTraining.push(
            rgb.reduce((accumulator, value) => accumulator + value / 255, 0) >=
              1.5
              ? 1
              : -1
          );
        }
      }
    }, 1000);
  }
}

class Network {
  constructor(x, images) {
    this.x = x;
    this.images = images;

    this.w = this.x[0].map((line) => this.x[0].map((value) => 0));
    this.deference = 400;
    // this.deference = 0;

    this.x.forEach((example, index) => {
      example.forEach((value, indexValue) => {
        for (let i = 0; i < example.length; i++) {
          this.w[indexValue][i] += this.sign(value * example[i]);
        }
      });
    });

    this.w = this.w.map((line) => line.map((value) => value / this.w.length));

    for (let i = 0; i < this.w.length; i++) {
      this.w[i][i] = 0;
    }

    this.seemToBe = {};
  }

  sign(x) {
    return x < 0 ? -1 : 1;
  }

  in(y) {
    let result = -1;
    this.seemToBe = {};

    for (let i = 0; i < this.x.length; i++) {
      let coincidence = 0;

      this.x[i].forEach((value, indexValue) => {
        coincidence += value == y[indexValue] ? 1 : 0;
      });

      if (coincidence == y.length) {
        result = i;
        break;
      } else if (coincidence > y.length - this.deference) {
        console.log(i, coincidence, y.length, y.length - this.deference);
        this.seemToBe[coincidence] = i;
      }
    }
    if (Object.keys(this.seemToBe).length > 0) {
      result = this.seemToBe[Math.max(...Object.keys(this.seemToBe))];
    }
    return result;
  }

  result(y) {
    let i = 0;
    while (this.in(y) < 0 && i < 10) {
      i++;
      y = y.map((value, index) => {
        let y1 = 0;
        for (let i = 0; i < y.length; i++) {
          y1 += y[i] * this.w[index][i];
        }
        return this.sign(y1);
      });
      i++;
    }
    return this.in(y);
  }

  showResult(canv, imageNumber, iDontKnowImage) {
    canv.drawImage(
      imageNumber > -1 ? this.images[imageNumber] : iDontKnowImage,
      0,
      0
    );
    return imageNumber;
  }
}

class Canvas {
  constructor(id, size, parent) {
    this.id = id;
    this.width = size[0];
    this.height = size[1];
    this.parent = parent;
    this.createElement();
  }
  createElement() {
    this.newElement = document.createElement("canvas");
    this.newElement.width = this.width;
    this.newElement.height = this.height;
    this.newElement.id = this.id;
    this.parent.appendChild(this.newElement);
    this.obj = this.parent.querySelector("#" + this.id);
    this.getContext();
    this.events();
    this.allFill();
  }
  events() {
    let draw = false,
      context = this.context;
    context.strokeStyle = "#000";
    // context.lineWidth = 0.1;
    context.lineWidth = 4;
    this.obj.addEventListener("mousedown", function (e) {
      let x = e.pageX - this.offsetLeft,
        y = e.pageY - this.offsetTop;
      draw = true;
      context.beginPath();
      context.moveTo(x, y);
    });
    this.obj.addEventListener("mousemove", function (e) {
      if (draw) {
        let x = e.pageX - this.offsetLeft,
          y = e.pageY - this.offsetTop;
        context.lineTo(x, y);
        context.stroke();
      }
    });
    this.obj.addEventListener("mouseup", function (e) {
      let x = e.pageX - this.offsetLeft,
        y = e.pageY - this.offsetTop;
      context.lineTo(x, y);
      context.stroke();
      context.closePath();
      draw = false;
    });
  }
  getContext() {
    this.context = this.obj.getContext("2d");
    return this.context;
  }
  drawImage(image) {
    this.context.drawImage(image, 0, 0);
  }
  allFill() {
    this.context.fillStyle = "white";
    this.context.fillRect(0, 0, this.width, this.height);
  }
}

let input = new Input(34, "images/png/numbers", "png", 1);

window.onload = () => {
  input.load();
  network = new Network(input.pixels, input.images);
  can = new Canvas("New_canvas", [32, 32], document.body);

  document.querySelector(".clear").addEventListener("click", function () {
    can.allFill();
  });

  document.querySelector(".load").addEventListener("click", function () {
    input.loadTrain("images/png/numbers/4.png");
  });

  document.querySelector(".identify").addEventListener("click", function () {
    input.loadTrain("");
    setTimeout(() => {
      console.log(
        network.showResult(
          context,
          network.result(input.examplesTraining),
          input.iDontKnowImage
        )
      );
    }, 1000);
  });
};
