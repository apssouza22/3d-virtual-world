class Car {
   static load(info) {
      const car = new Car(info.x, info.y, info.angle, info.carOptions);
      car.brain = info.brain;
      return car;
   }
   constructor(x, y, angle = 0, carOptions) {
      this.ticks = 0;
      this.x = x;
      this.y = y;
      this.speed = 0;
      this.angle = angle + Math.PI / 2;

      this.damaged = false;
      this.distance = 0;
      this.fittness = 0;

      this.message = null;

      this.assignedBorders = [];

      this.frameCount = 0;
      this.state="car";

      this.setOptions(carOptions);
      this.setSensorAndBrainOptions(carOptions);
   }

   increaseSize(){
      let cnt=0;
      const int=setInterval(()=>{
         cnt++;
         if(cnt>30){
            clearInterval(int);
            return;
         }
         this.width*=1.018;
         this.height*=1.018;
      },30)
   }

   resetControls() {
      this.controls = new Controls(this.type);
   }

   setSensorAndBrainOptions(carOptions) {
      this.setSensorOptions(carOptions);
      this.setBrainOptions(carOptions);
   }

   setSensorOptions(carOptions) {
      this.sensorOptions = carOptions.sensorOptions;

      if (carOptions.type != "DUMMY") {
         this.sensor = new Sensor(this, carOptions.sensorOptions);
         this.fakeSensor = new Sensor(this, carOptions.sensorOptions);

         this.stopSensor = new Sensor(this, {
            rayCount: 1,
            rayLength: carOptions.sensorOptions.rayLength,
         });
         /*
         this.lightSensor = new Sensor(this, {
            rayCount: 3,
            rayLength: carOptions.sensorOptions.rayLength,
            raySpread:0.2
         }); */
         this.lightSensor = new Sensor(this, {
            rayCount: 7,
            rayLength: carOptions.sensorOptions.rayLength,
            raySpread: 0.8,
         });

         this.yieldSensor = new Sensor(this, {
            rayCount: 1,
            rayLength: carOptions.sensorOptions.rayLength,
         });

         this.crossingSensor = new Sensor(this, {
            rayCount: 1,
            rayLength: carOptions.sensorOptions.rayLength,
         });

         this.carSensor = new Sensor(this, {
            rayCount: 20,
            rayLength: carOptions.sensorOptions.rayLength * 2,
            raySpread: Math.PI * 0.6,
            rayOffset: -Math.PI / 4,
         });
      }
   }

   setBrainOptions(carOptions) {
      this.brainOptions = carOptions.brainOptions;

      if (carOptions.type != "DUMMY") {
         this.brain = new NeuralNetwork([
            this.sensor.rayCount + carOptions.brainOptions.extraInputs.length,
            ...carOptions.brainOptions.hiddenLayerNodeCounts,
            carOptions.brainOptions.outputs.length,
         ]);
         this.nn = NNEditor.graphFromCar(this, nnCanvas.width, nnCanvas.height);
      }
   }

   setTypeAndAutoForward(carOptions) {
      this.type = carOptions.type;
      this.autoForward = carOptions.autoForward;
      this.useBrain = this.type == "AI";
      this.controls = new Controls(this.type);
   }

   setOptions(carOptions) {
      this.width = carOptions.width;
      this.height = carOptions.height;

      this.acceleration = carOptions.acceleration;
      this.maxSpeed = carOptions.maxSpeed;
      this.friction = carOptions.friction;
      this.color = carOptions.color;
      this.type = carOptions.type;
      this.useBrain = carOptions.type == "AI";
      this.autoForward = carOptions.autoForward;

      this.controls = new Controls(carOptions.type);

      this.img = new Image();
      if (carOptions.height > carOptions.width * 2) {
         this.img.src = "bus.png";
      } else {
         this.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/car.png";
      }

      this.carImg = this.img;
      this.boatImg = new Image();
      this.boatImg.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/boat.png";
      this.helicopterImg = new Image();
      this.helicopterImg.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/helicopter.png";

      this.mask = document.createElement("canvas");
      this.mask.width = carOptions.width;
      this.mask.height = carOptions.height;

      this.carMask=this.mask;

      const maskCtx = this.mask.getContext("2d");
      this.img.onload = () => {
         maskCtx.fillStyle = carOptions.color;
         maskCtx.rect(0, 0, this.width, this.height);
         maskCtx.fill();

         maskCtx.globalCompositeOperation = "destination-atop";
         maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
      };


      this.boatMask = document.createElement("canvas");
      this.boatMask.width = carOptions.width;
      this.boatMask.height = carOptions.height;

      const boatMaskCtx = this.boatMask.getContext("2d");
      this.boatImg.onload = () => {
         boatMaskCtx.fillStyle = carOptions.color;
         boatMaskCtx.rect(0, 0, this.width, this.height);
         boatMaskCtx.fill();

         boatMaskCtx.globalCompositeOperation = "destination-atop";
         boatMaskCtx.drawImage(this.boatImg, 0, 0, this.width, this.height);
      };
      
      this.helicopterMask = document.createElement("canvas");
      this.helicopterMask.width = carOptions.width;
      this.helicopterMask.height = carOptions.height;

      const helicopterMaskCtx = this.helicopterMask.getContext("2d");
      this.helicopterImg.onload = () => {
         helicopterMaskCtx.fillStyle = carOptions.color;
         helicopterMaskCtx.rect(0, 0, this.width, this.height);
         helicopterMaskCtx.fill();

         helicopterMaskCtx.globalCompositeOperation = "destination-atop";
         helicopterMaskCtx.drawImage(this.helicopterImg, 0, 0, this.width, this.height);
      };
   }

   clone(info) {
      this.setSensorAndBrainOptions(info);
      this.brain = info.brain;

      /*if(info.nn){
         this.nn=NN.load(info.nn);
      }else{
         this.nn=NNEditor.graphFromCar(this,rightBarWidth,rightBarWidth);
      }*/
   }

   activateRespaunSequence(reset = false) {
      //return;
      if (this.message == null) {
         this.message = "DAMAGED";
         this.tm=setTimeout(() => {
            this.message = null;
            this.respaun(reset);
            /*
                this.message = "Respaun in 3";
                setTimeout(() => {
                    this.message = "Respaun in 2";
                    setTimeout(() => {
                        this.message = "Respaun in 1";
                        setTimeout(() => {
                            this.message = null;
                            this.respaun(reset);
                        }, 1000);
                    }, 1000);
                }, 1000);*/
         }, 1500);
      }
   }

   update(
      roadBorders,
      carBorders,
      stopBorders,
      lightBorders,
      yieldCrossingBorders,
      target
   ) {
      this.target = target;
      if(this.state=="helicopter"){
         this.damaged=false;
         clearInterval(this.tm);
         roadBorders=[];
         this.assignedBorders=[];
         this.layer=1;
      }
      if (!this.damaged) {
         this.#move();
         this.polygon = this.createPolygon();
         if(this.state=="helicopter"){
            this.damaged=false;
         }else{
            const damaged = this.#assessDamage(roadBorders, carBorders);
            this.damaged=damaged;
            this.borderDamaged=damaged;
         }
         
         if (this.damaged) {
            this.activateRespaunSequence(true);
         }
         if (this.sensor) {
            //const borders=this.assignedBorders?this.assignedBorders:roadBorders;
            const borders = [...roadBorders, ...this.assignedBorders];
            this.sensor.update(this, borders);
            this.fakeSensor.update(this, roadBorders);

            const offsets = this.sensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );

            this.stopSensor.update(this, stopBorders, 0.5);
            const stopOffsets = this.stopSensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );

            this.lightSensor.update(this, lightBorders, 0.5);
            const lightOffsets = this.lightSensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );

            this.yieldSensor.update(this, yieldCrossingBorders, 0.5);
            const yieldOffsets = this.yieldSensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );

            this.crossingSensor.update(this, yieldCrossingBorders, 0.5);
            const crossingOffsets = this.crossingSensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );

            this.carSensor.update(this, carBorders);
            const carOffsets = this.carSensor.readings.map((s) =>
               s == null ? 0 : 1 - s.offset
            );
            lightOffsets.push(...carOffsets);

            /*const offsets = stopOffsets.concat(
               this.sensor.readings.map((s) => (s == null ? 1 : s.offset))
            );*/
            if (this.brainOptions.extraInputs.includes("⏱️")) {
               offsets.push(this.speed / this.maxSpeed);
            }
            if (this.brainOptions.extraInputs.includes("🛑")) {
               offsets.push(Math.max(...stopOffsets));
            }
            if (this.brainOptions.extraInputs.includes("🚦")) {
               offsets.push(Math.max(...lightOffsets));
            }
            if (this.brainOptions.extraInputs.includes("🚶")) {
               offsets.push(Math.max(...crossingOffsets));
            }
            if (this.brainOptions.extraInputs.includes("⚠️")) {
               offsets.push(Math.max(...yieldOffsets));
            }

            if (this.brainOptions.extraInputs.includes("🎯")) {
               if (target) {
                  const carDir = normalize(
                     subtract(this.polygon[3], this.polygon[0])
                  );
                  const dirToTarget = normalize(subtract(this, target.center));
                  const targetDot = dot(carDir, dirToTarget);
                  const crossProduct = cross(carDir, dirToTarget);
                  const angleFeature =
                     (Math.acos(targetDot) * Math.sign(crossProduct)) / Math.PI;

                  offsets.push(angleFeature);
               } else {
                  offsets.push(0);
               }
            }

            this.inputs = offsets;
            const old_outputs = NeuralNetwork.feedForward(offsets, this.brain);

            const outputs = this.nn.feedForward(offsets);

            if (this.useBrain) {
               for (let i = 0; i < outputs.length; i++) {
                  const opt = this.brainOptions.outputs[i];
                  switch (opt) {
                     case "🠉":
                        this.controls.forward = outputs[i];
                        break;
                     case "🠈":
                        this.controls.left = outputs[i];
                        break;
                     case "🠊":
                        this.controls.right = outputs[i];
                        break;
                     case "🠋":
                        this.controls.reverse = outputs[i];
                        break;
                  }
               }
            }
            //this.controls.forward ||= this.autoForward;
         }
         this.ticks++;
      }
   }

   #assessDamage(roadBorders) {
      if (this.invulnerable) {
         return false;
      }
      for (let i = 0; i < roadBorders.length; i++) {
         if (polysIntersect(this.polygon, roadBorders[i])) {
            return true;
         }
      }
      /*
      for (let i = 0; i < traffic.length; i++) {
         if (polysIntersect(this.polygon, traffic[i].polygon)) {
            return true;
         }
      }
      */
      return false;
   }

   createPolygon() {
      const points = [];
      const rad = Math.hypot(this.width, this.height) / 2;
      const alpha = Math.atan2(this.width, this.height);
      points.push({
         x: this.x - Math.sin(this.angle - alpha) * rad,
         y: this.y - Math.cos(this.angle - alpha) * rad,
      });
      points.push({
         x: this.x - Math.sin(this.angle + alpha) * rad,
         y: this.y - Math.cos(this.angle + alpha) * rad,
      });
      points.push({
         x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
         y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
      });
      points.push({
         x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
         y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
      });
      return points;
   }

   #move() {
      if (this.controls.forward) {
         this.speed += this.acceleration;
      }
      if (this.controls.reverse) {
         this.speed -= this.acceleration;
      }

      if (this.speed > this.maxSpeed) {
         this.speed = this.maxSpeed;
      }
      if (this.speed < -this.maxSpeed / 2) {
         this.speed = -this.maxSpeed / 2;
      }

      if (this.speed > 0) {
         this.speed -= this.friction;
      }
      if (this.speed < 0) {
         this.speed += this.friction;
      }
      if (Math.abs(this.speed) < this.friction) {
         this.speed = 0;
      }

      if (this.speed != 0) {
         const flip = this.speed > 0 ? 1 : -1;
         if (this.controls.left) {
            this.angle += 0.03 * flip;
         }
         if (this.controls.right) {
            this.angle -= 0.03 * flip;
         }
      }

      this.distance += this.speed;
      this.absDist += Math.abs(this.speed);

      if (this.parking) {
         const dist = distance(this.parking, this);

         this.fittness = 1 - distance(this.parking, this) / 10000;
      } else {
         //this.fittness += this.speed;
         //this.fittness += Math.max(0, this.speed);
         this.fittness += Math.abs(this.speed);
      }

      //this.fittness=this.angle

      this.x -= Math.sin(this.angle) * this.speed;
      this.y -= Math.cos(this.angle) * this.speed;
      //console.log(this.speed);
   }

   respaun(reset) {
      this.damaged = false;
      if (reset) {
         /*
            const seg = getNearestSegment(this, world.laneGuides);
            const around = new Point(
            this.x + (Math.random() - 0.5) * 100,
            this.y + (Math.random() - 0.5) * 100
        );
            const proj = seg.projectPoint(this);
            this.x = proj.point.x;
            this.y = proj.point.y;
            //this.speed = -this.speed;
            this.angle = -angle(seg.directionVector()) + Math.PI / 2;
            */
      }
      this.invulnerable = true;
      setTimeout(() => {
         this.invulnerable = false;
      }, 3000);
   }

   draw(ctx, optimize = false) {
      return;
      switch(this.state){
         case "car":
            this.img=this.carImg;
            this.mask=this.carMask;
            break;
         case "boat":
            this.img=this.boatImg;
            this.mask=this.boatMask;
            break;
         case "helicopter":
            this.img=this.helicopterImg;
            this.mask=this.helicopterMask;
            break;
         default:
            this.img=this.carImg;
            this.mask=this.carMask;
            break;
         
      }
      this.frameCount++;
      /*if (this.damaged) {
         return;
      }*/

      if (this.fakeSensor && !optimize) {
         //if (this.sensor) {
         this.fakeSensor.draw(ctx, "white", true);
      }
      if (this.sensor && !optimize) {
         //if (this.sensor) {
         this.sensor.draw(ctx, this.color, true);
         // this.sensor.draw(ctx,"white",true);
      }

      if (this.crossingSensor && !optimize) {
         this.crossingSensor.draw(ctx, "white", true);
      }
      if (this.yieldSensor && !optimize) {
         this.yieldSensor.draw(ctx, "white", true);
      }
      if (this.stopSensor && !optimize) {
         this.stopSensor.draw(ctx, this.color, true);
      }
      if (this.lightSensor && !optimize) {
         this.lightSensor.draw(ctx, this.color, true);
      }
      if (this.carSensor && !optimize) {
         this.carSensor.draw(ctx, this.color, true);
      }

      /*
      if(this.target && !optimize){
         ctx.beginPath();
         ctx.moveTo(this.x,this.y);
         ctx.lineTo(this.target.center.x,this.target.center.y);
         ctx.strokeStyle="black";
         ctx.lineWidth=1;
         ctx.setLineDash([2,2]);
         ctx.stroke();
         ctx.setLineDash([]);
      }*/

      if (optimize) {
         ctx.beginPath();
         ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
         for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
         }
         ctx.fillStyle = this.color;
         ctx.strokeStyle = this.marked ? "red" : "rgba(0,0,0,0.2)";
         ctx.fill();
         ctx.closePath();
         ctx.stroke();
      } else {
         ctx.save();
         ctx.translate(this.x, this.y);
         ctx.rotate(-this.angle);
         if (!this.damaged) {
            if (
               !this.invulnerable ||
               (this.invulnerable && this.frameCount % 6 < 3)
            ) {
               ctx.drawImage(
                  this.mask,
                  -this.width / 2,
                  -this.height / 2,
                  this.width,
                  this.height
               );
               ctx.globalCompositeOperation = "multiply";
            }
         }
         ctx.drawImage(
            this.img,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
         );
         ctx.globalCompositeOperation = "source-over";

         if(this.state=="helicopter"){
            ctx.beginPath();
            ctx.fillStyle="rgba(0,0,0,0.2)";
            const offset=-Math.PI/2;
            const x=Math.cos(offset)*15;
            const y=Math.sin(offset)*15;
            ctx.arc(x,y,this.width,0,Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            const randAng=new Date().getTime()/7;
            //const randAng2=-new Date().getTime()/10;
            ctx.moveTo(x-Math.cos(randAng)*this.width,y-Math.sin(randAng)*this.width);
            ctx.lineTo(x+Math.cos(randAng)*this.width,y+Math.sin(randAng)*this.width);
            ctx.strokeStyle="rgba(255,255,255,0.4)";
            ctx.stroke();
         }

         ctx.restore();

      }

      if (this.message) {
         ctx.beginPath();
         ctx.textAlign = "center";
         ctx.textBaseline = "top";
         ctx.font = "bold 30px Arial";
         ctx.strokeStyle = "rgba(255,255,255,0.7)";
         ctx.lineWidth = 4;
         ctx.lineJoin = "round";
         ctx.lineCap = "round";
         ctx.fillStyle = "#444"; //this.message == "DAMAGED" ? "BLACK" : "blue";
         if (this.message != "DAMAGED") {
            ctx.strokeText(this.message, this.x, this.y + 60);
            ctx.fillText(this.message, this.x, this.y + 60);
         }
      }
   }
}
