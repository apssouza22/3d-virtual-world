class Controls {
   constructor(type) {
      this.forward = false;
      this.left = false;
      this.right = false;
      this.reverse = false;

      switch (type) {
         case "KEYS":
            this.#addKeyboardListeners();
            break;
         case "AI":
            this.#addKeyboardListeners();
            break;
         case "DUMMY":
            this.forward = true;
            break;
      }
   }

   #addKeyboardListeners() {
      document.onkeydown = (event) => {
         if(!manual){
            return;
         }
         switch (event.key) {
            case "ArrowLeft":
               this.left = true;
               break;
            case "ArrowRight":
               this.right = true;
               break;
            case "ArrowUp":
               this.forward = true;
               break;
            case "ArrowDown":
               this.reverse = true;
               break;
         }
      };
      document.onkeyup = (event) => {
         if(!manual){
            return;
         }
         switch (event.key) {
            case "ArrowLeft":
               this.left = false;
               break;
            case "ArrowRight":
               this.right = false;
               break;
            case "ArrowUp":
               this.forward = false;
               break;
            case "ArrowDown":
               this.reverse = false;
               break;
         }
      };
   }
}
