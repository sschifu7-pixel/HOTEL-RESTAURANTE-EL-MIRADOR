// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TouristEscrow
 * @dev Contrato de Fideicomiso Escalonado (Escrow) para el Restaurante Campestre El Mirador.
 * Permite a los turistas depositar fondos y al restaurante liberar los pagos en 6 hitos basados en el servicio.
 */
contract TouristEscrow {
    address payable public tourist;
    address payable public restaurant;
    
    uint256 public totalDeposit;
    uint256 public groupSize;
    string public allergy;
    
    // Seguimiento del estado de los hitos (Hito 1 al 6)
    mapping(uint256 => bool) public milestoneReleased;
    
    event EscrowCreated(address indexed tourist, uint256 amount, string allergy);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address indexed beneficiary);
    event Refunded(address indexed tourist, uint256 amount);
    
    modifier onlyRestaurant() {
        require(msg.sender == restaurant, "Solo el restaurante (owner) puede ejecutar esta accion");
        _;
    }
    
    modifier onlyTourist() {
        require(msg.sender == tourist, "Solo el turista puede ejecutar esta accion");
        _;
    }
    
    /**
     * @dev Inicializa el contrato con la direccion del restaurante.
     * @param _restaurant Direccion de la billetera del restaurante que recibira los fondos.
     */
    constructor(address payable _restaurant) {
        require(_restaurant != address(0), "Direccion del restaurante invalida");
        restaurant = _restaurant;
    }
    
    /**
     * @dev El turista inicializa el fideicomiso enviando ETH y registrando su informacion de grupo y alergias.
     */
    function createEscrow(uint256 _groupSize, string memory _allergy) external payable {
        require(msg.value > 0, "Debe enviar fondos en ETH");
        require(tourist == address(0), "El fideicomiso ya ha sido inicializado");
        
        tourist = payable(msg.sender);
        totalDeposit = msg.value;
        groupSize = _groupSize;
        allergy = _allergy;
        
        emit EscrowCreated(tourist, msg.value, _allergy);
    }
    
    /**
     * @dev Libera fondos correspondientes a un hito especifico del servicio.
     * Hito 1: Hospedaje (16.6%)
     * Hito 2: Gastronomía (16.6%)
     * Hito 3: Lancha (16.6%)
     * Hito 4: Senderismo (16.6%)
     * Hito 5: Experiencia Nocturna (Fogata) (16.6%)
     * Hito 6: Cierre (Saldo restante / 16.6% aprox)
     * Encursa la secuencia: el hito N solo puede liberarse si el hito N-1 ya fue liberado.
     */
    function releaseMilestone(uint256 milestoneId) external onlyRestaurant {
        require(tourist != address(0), "El fideicomiso no ha sido inicializado");
        require(milestoneId >= 1 && milestoneId <= 6, "ID de hito invalido (debe ser del 1 al 6)");
        require(!milestoneReleased[milestoneId], "Este hito ya fue liberado");
        
        // Validar secuencia
        if (milestoneId > 1) {
            require(milestoneReleased[milestoneId - 1], "El hito anterior no ha sido liberado");
        }
        
        milestoneReleased[milestoneId] = true;
        uint256 releaseAmount;
        
        if (milestoneId == 6) {
            // Para el ultimo hito, liberamos todo el saldo restante para evitar residuos de redondeo
            releaseAmount = address(this).balance;
        } else {
            releaseAmount = totalDeposit / 6;
        }
        
        require(releaseAmount <= address(this).balance, "Saldo insuficiente en el contrato");
        
        (bool success, ) = restaurant.call{value: releaseAmount}("");
        require(success, "Transfer to restaurant failed");
        emit MilestoneReleased(milestoneId, releaseAmount, restaurant);
    }
    
    /**
     * @dev Reembolsa la totalidad de los fondos remanentes en el contrato al turista en caso de cancelacion o inconformidad.
     */
    function refundRemaining() external onlyRestaurant {
        require(tourist != address(0), "El fideicomiso no ha sido inicializado");
        uint256 remaining = address(this).balance;
        require(remaining > 0, "No hay fondos remanentes en el contrato");
        
        (bool success, ) = tourist.call{value: remaining}("");
        require(success, "Refund to tourist failed");
        emit Refunded(tourist, remaining);
    }
    
    /**
     * @dev Permite recibir depuraciones de fondos directas si es necesario.
     */
    receive() external payable {
        if (tourist == address(0)) {
            tourist = payable(msg.sender);
            totalDeposit = msg.value;
            groupSize = 1;
            allergy = "Ninguna";
            emit EscrowCreated(tourist, msg.value, "Ninguna");
        }
    }
}
