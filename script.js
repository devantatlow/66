body {
  margin: 0;
  font-family: sans-serif;
  color: #fff;
}

#map {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 100%;
  z-index: -1;
}

#story {
  width: 35%;
  max-width: 500px;
  background: rgba(34, 34, 34, 0.85);
  padding: 2rem;
  height: 100vh;
  overflow-y: scroll;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

#intro {
  padding: 1rem;
  margin-bottom: 2rem;
  background: rgba(51, 51, 51, 0.9);
  border-left: 5px solid #ff5733;
  color: #fff;
}

#intro h1 {
  margin-top: 0;
  color: #ff5733;
}

.step {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(51, 51, 51, 0.9);
  border-left: 5px solid #444;
  transition: background 0.3s ease;
  position: relative;
}

.step.is-active {
  background: rgba(66, 135, 245, 0.2);
  border-left: 5px solid #4287f5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.step h2 {
  margin-top: 0;
  color: #4287f5;
  text-transform: capitalize;
}

.step img {
  width: 100%;
  height: auto;
  object-fit: contain;
  margin-top: 1rem;
  margin-bottom: 1rem;
  max-height: none;
}

.caption {
  font-size: 0.85rem;
  color: #bbb;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Census tract data styling */
.census-step {
  border-left: 5px solid #ff9800;
}

.census-step.is-active {
  background: rgba(255, 152, 0, 0.2);
  border-left: 5px solid #ff9800;
}

.census-step h2 {
  color: #ff9800;
}

.census-content {
  display: flex;
  justify-content: space-around;
  margin: 1.5rem 0;
}

.data-point {
  text-align: center;
  padding: 0.5rem;
}

.data-value {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
}

.data-label {
  font-size: 0.8rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Custom line indicator for active step */
.step.is-active::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  width: 20px;
  height: 2px;
  background: #4287f5;
}

.census-step.is-active::after {
  background: #ff9800;
}

/* Control panel styling */
#control-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(34, 34, 34, 0.85);
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  color: #fff;
}

#control-panel button {
  background: #4287f5;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

#control-panel button:hover {
  background: #2a6ad9;
}

#order-editor {
  width: 300px;
  max-width: 80vw;
}

#sortable-list {
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.sortable-item {
  padding: 8px;
  margin-bottom: 5px;
  background: rgba(51, 51, 51, 0.9);
  border: 1px solid #444;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
}

.sortable-item.census-item {
  border-left: 4px solid #ff9800;
}

.sortable-ghost {
  opacity: 0.5;
  background: #4287f5;
}

/* Connection marker style */
.connection-marker {
  width: 12px;
  height: 12px;
  background-color: #4287f5;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

/* For better mobile experience */
@media (max-width: 768px) {
  #story {
    width: 80%;
    max-width: none;
    padding: 1rem;
  }
  
  .step img {
    max-height: 200px;
  }
  
  .census-content {
    flex-direction: column;
  }
  
  .data-point {
    margin-bottom: 1rem;
  }
}
