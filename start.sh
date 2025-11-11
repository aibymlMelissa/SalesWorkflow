#!/bin/bash

# AI Sales Workflow Builder - Start/Stop Script
# Usage: ./start.sh [start|stop|restart|status]

PID_FILE_BACKEND=".backend.pid"
PID_FILE_FRONTEND=".frontend.pid"
LOG_DIR="logs"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to check if a process is running
is_running() {
    local pid_file=$1
    if [[ -f $pid_file ]]; then
        local pid=$(cat $pid_file)
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        else
            rm -f $pid_file
            return 1
        fi
    fi
    return 1
}

# Function to start the backend
start_backend() {
    if is_running $PID_FILE_BACKEND; then
        print_warning "Backend is already running (PID: $(cat $PID_FILE_BACKEND))"
        return
    fi

    print_status "Starting backend server..."
    nohup npm run server > $LOG_DIR/backend.log 2>&1 &
    local pid=$!
    echo $pid > $PID_FILE_BACKEND

    # Wait a moment and check if it started successfully
    sleep 2
    if is_running $PID_FILE_BACKEND; then
        print_success "Backend started successfully (PID: $pid, Port: 3001)"
    else
        print_error "Failed to start backend. Check $LOG_DIR/backend.log for details."
        rm -f $PID_FILE_BACKEND
    fi
}

# Function to start the frontend
start_frontend() {
    if is_running $PID_FILE_FRONTEND; then
        print_warning "Frontend is already running (PID: $(cat $PID_FILE_FRONTEND))"
        return
    fi

    print_status "Starting frontend server..."
    nohup npm run dev > $LOG_DIR/frontend.log 2>&1 &
    local pid=$!
    echo $pid > $PID_FILE_FRONTEND

    # Wait a moment and check if it started successfully
    sleep 3
    if is_running $PID_FILE_FRONTEND; then
        print_success "Frontend started successfully (PID: $pid, Port: 5274)"
    else
        print_error "Failed to start frontend. Check $LOG_DIR/frontend.log for details."
        rm -f $PID_FILE_FRONTEND
    fi
}

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=$2

    if is_running $pid_file; then
        local pid=$(cat $pid_file)
        print_status "Stopping $service_name (PID: $pid)..."

        # Try graceful shutdown first
        kill $pid

        # Wait up to 10 seconds for graceful shutdown
        local count=0
        while is_running $pid_file && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done

        # Force kill if still running
        if is_running $pid_file; then
            print_warning "Force killing $service_name..."
            kill -9 $pid
            sleep 1
        fi

        if ! is_running $pid_file; then
            print_success "$service_name stopped successfully"
            rm -f $pid_file
        else
            print_error "Failed to stop $service_name"
        fi
    else
        print_warning "$service_name is not running"
    fi
}

# Function to show status
show_status() {
    print_status "=== AI Sales Workflow Builder Status ==="

    if is_running $PID_FILE_BACKEND; then
        print_success "✓ Backend: Running (PID: $(cat $PID_FILE_BACKEND), Port: 3001)"
        # Test backend health
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "  └─ Health check: OK"
        else
            print_error "  └─ Health check: FAILED"
        fi
    else
        print_error "✗ Backend: Not running"
    fi

    if is_running $PID_FILE_FRONTEND; then
        print_success "✓ Frontend: Running (PID: $(cat $PID_FILE_FRONTEND), Port: 5274)"
    else
        print_error "✗ Frontend: Not running"
    fi

    echo ""
    print_status "URLs:"
    print_status "  Frontend: http://localhost:5274"
    print_status "  Backend:  http://localhost:3001"
    print_status "  API:      http://localhost:3001/api"
    print_status "  Health:   http://localhost:3001/health"
}

# Function to view logs
show_logs() {
    local service=$1
    case $service in
        "backend")
            if [[ -f "$LOG_DIR/backend.log" ]]; then
                print_status "Backend logs (last 50 lines):"
                tail -n 50 $LOG_DIR/backend.log
            else
                print_warning "No backend logs found"
            fi
            ;;
        "frontend")
            if [[ -f "$LOG_DIR/frontend.log" ]]; then
                print_status "Frontend logs (last 50 lines):"
                tail -n 50 $LOG_DIR/frontend.log
            else
                print_warning "No frontend logs found"
            fi
            ;;
        *)
            print_error "Usage: $0 logs [backend|frontend]"
            ;;
    esac
}

# Main script logic
case "${1:-start}" in
    "start")
        print_status "=== Starting AI Sales Workflow Builder ==="

        # Check if npm is available
        if ! command -v npm &> /dev/null; then
            print_error "npm is not installed. Please install Node.js and npm first."
            exit 1
        fi

        # Check if dependencies are installed
        if [[ ! -d "node_modules" ]]; then
            print_status "Installing dependencies..."
            npm install
        fi

        start_backend
        sleep 2
        start_frontend
        sleep 2
        show_status

        print_success "=== Startup complete ==="
        print_status "Press Ctrl+C or run './start.sh stop' to stop all services"
        ;;

    "stop")
        print_status "=== Stopping AI Sales Workflow Builder ==="
        stop_service "Frontend" $PID_FILE_FRONTEND
        stop_service "Backend" $PID_FILE_BACKEND
        print_success "=== Shutdown complete ==="
        ;;

    "restart")
        print_status "=== Restarting AI Sales Workflow Builder ==="
        $0 stop
        sleep 2
        $0 start
        ;;

    "status")
        show_status
        ;;

    "logs")
        show_logs $2
        ;;

    "help"|"-h"|"--help")
        echo "AI Sales Workflow Builder Control Script"
        echo ""
        echo "Usage: $0 [COMMAND] [OPTIONS]"
        echo ""
        echo "Commands:"
        echo "  start          Start both backend and frontend servers (default)"
        echo "  stop           Stop all running servers"
        echo "  restart        Stop and start all servers"
        echo "  status         Show status of all services"
        echo "  logs [service] Show logs for backend or frontend"
        echo "  help           Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Start all services"
        echo "  $0 start              # Start all services"
        echo "  $0 stop               # Stop all services"
        echo "  $0 status             # Check status"
        echo "  $0 logs backend       # Show backend logs"
        echo "  $0 logs frontend      # Show frontend logs"
        ;;

    *)
        print_error "Unknown command: $1"
        print_status "Run '$0 help' for usage information"
        exit 1
        ;;
esac