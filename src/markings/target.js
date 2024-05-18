class Target extends Marking {
   constructor(center, directionVector, width, height, img=null) {
      super(center, directionVector, width, height);
      this.type = "target";
      this.img = img;
   }

   draw(ctx) {
      this.center.draw(ctx, { color: "red", size: 30 });
      this.center.draw(ctx, { color: "white", size: 20 });
      this.center.draw(ctx, { color: "red", size: 10 });
   }
}